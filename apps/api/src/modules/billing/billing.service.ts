import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type {
  CreateBillingPortalInput,
  CreateCheckoutSessionInput,
} from "@expense-tracker/types";
import type Stripe from "stripe";
import {
  requireOwner,
  requireUserByAuth0Sub,
} from "../households/household-access";
import { HouseholdsRepository } from "../households/households.repository";
import { BillingLimitsService } from "./billing-limits.service";
import { BillingRepository } from "./billing.repository";
import type { SubscriptionView } from "./interfaces/billing.interface";
import {
  cycleFromSubscription,
  mapStripeStatus,
  periodEndDate,
} from "./stripe-subscription.mapper";
import { StripeClient } from "./stripe.client";
import { hasPaidAccess } from "./plan-catalog";

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly repo: BillingRepository,
    private readonly stripe: StripeClient,
    private readonly households: HouseholdsRepository,
    private readonly limits: BillingLimitsService
  ) {}

  getStatus(householdId: string): Promise<SubscriptionView> {
    return this.toViewForHousehold(householdId);
  }

  assertCanCreateTransaction(householdId: string): Promise<void> {
    return this.limits.assertCanCreateTransaction(householdId);
  }

  assertCanRunOcr(householdId: string): Promise<void> {
    return this.limits.assertCanRunOcr(householdId);
  }

  recordOcrUse(householdId: string): Promise<void> {
    return this.limits.recordOcrUse(householdId);
  }

  resolveLimits(householdId: string) {
    return this.limits.resolveLimits(householdId);
  }

  async createCheckoutSession(
    householdId: string,
    auth0Sub: string,
    input: CreateCheckoutSessionInput
  ): Promise<{ url: string }> {
    const user = await requireUserByAuth0Sub(this.households, auth0Sub);
    await requireOwner(this.households, householdId, user.id);
    const household = await this.households.findHouseholdById(householdId);
    if (!household) throw new NotFoundException("Household not found");

    const sub = await this.repo.ensureFreeRow(householdId);
    let customerId = sub.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.createCustomer({
        email: user.email,
        name: household.name,
        householdId,
      });
      customerId = customer.id;
      sub.stripeCustomerId = customerId;
      await this.repo.saveSubscription(sub);
    }

    const session = await this.stripe.createCheckoutSession({
      customerId,
      priceId: this.stripe.priceIdForCycle(input.cycle),
      householdId,
      successUrl: input.successUrl,
      cancelUrl: input.cancelUrl,
    });
    if (!session.url) {
      throw new BadRequestException("Stripe did not return a checkout URL");
    }
    return { url: session.url };
  }

  async createPortalSession(
    householdId: string,
    auth0Sub: string,
    input: CreateBillingPortalInput
  ): Promise<{ url: string }> {
    const user = await requireUserByAuth0Sub(this.households, auth0Sub);
    await requireOwner(this.households, householdId, user.id);
    const sub = await this.repo.ensureFreeRow(householdId);
    if (!sub.stripeCustomerId) {
      throw new BadRequestException("No Stripe customer for this household");
    }
    const session = await this.stripe.createBillingPortalSession({
      customerId: sub.stripeCustomerId,
      returnUrl: input.returnUrl,
    });
    return { url: session.url };
  }

  /** FR-BILL-005 — cancel at period end. */
  async cancelSubscription(
    householdId: string,
    auth0Sub: string
  ): Promise<SubscriptionView> {
    const user = await requireUserByAuth0Sub(this.households, auth0Sub);
    await requireOwner(this.households, householdId, user.id);
    const sub = await this.repo.ensureFreeRow(householdId);
    if (!sub.stripeSubscriptionId) {
      throw new BadRequestException("No active Stripe subscription");
    }
    const updated = await this.stripe.cancelAtPeriodEnd(
      sub.stripeSubscriptionId
    );
    return this.syncFromStripeSubscription(updated, householdId);
  }

  /** FR-BILL-006 — void open invoices + cancel (account deletion). */
  async prepareAccountDeletion(householdId: string): Promise<void> {
    const sub = await this.repo.findByHousehold(householdId);
    if (!sub?.stripeCustomerId) return;

    if (this.stripe.isConfigured()) {
      try {
        for (const inv of await this.stripe.listOpenInvoices(
          sub.stripeCustomerId
        )) {
          await this.stripe.voidInvoice(inv.id);
        }
        if (sub.stripeSubscriptionId) {
          await this.stripe.cancelImmediately(sub.stripeSubscriptionId);
        }
      } catch (err) {
        this.logger.error(
          `Account-deletion billing cleanup failed for ${householdId}`,
          err instanceof Error ? err.stack : String(err)
        );
        throw err;
      }
    }

    sub.plan = "free";
    sub.status = "canceled";
    sub.stripeSubscriptionId = null;
    sub.cancelAtPeriodEnd = false;
    sub.billingCycle = null;
    await this.repo.saveSubscription(sub);
  }

  async syncFromStripeSubscription(
    stripeSub: Stripe.Subscription,
    householdIdHint?: string
  ): Promise<SubscriptionView> {
    const householdId =
      householdIdHint ||
      stripeSub.metadata?.householdId ||
      (await this.lookupHouseholdId(stripeSub));
    if (!householdId) {
      throw new NotFoundException(
        "Cannot map Stripe subscription to household"
      );
    }

    const status = mapStripeStatus(stripeSub.status);
    const periodEnd = periodEndDate(stripeSub);
    const paid = hasPaidAccess({ status, currentPeriodEnd: periodEnd });

    const saved = await this.repo.applyStripeState({
      householdId,
      stripeCustomerId: String(stripeSub.customer),
      stripeSubscriptionId: stripeSub.id,
      plan: paid ? "pro" : "free",
      status,
      billingCycle: cycleFromSubscription(stripeSub),
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: Boolean(stripeSub.cancel_at_period_end),
    });
    return this.toView(saved);
  }

  async markLastPayment(
    householdId: string,
    outcome: "ok" | "failed"
  ): Promise<void> {
    const sub = await this.repo.findByHousehold(householdId);
    if (!sub) return;
    sub.lastPaymentStatus = outcome;
    if (outcome === "failed" && sub.status === "active") {
      sub.status = "past_due";
    }
    if (outcome === "ok" && sub.status === "past_due") {
      sub.status = "active";
    }
    await this.repo.saveSubscription(sub);
  }

  private async lookupHouseholdId(
    stripeSub: Stripe.Subscription
  ): Promise<string | null> {
    const row = await this.repo.findByStripeSubscriptionId(stripeSub.id);
    if (row) return row.householdId;
    const customerId =
      typeof stripeSub.customer === "string"
        ? stripeSub.customer
        : stripeSub.customer?.id;
    if (!customerId) return null;
    const byCust = await this.repo.findByStripeCustomerId(customerId);
    return byCust?.householdId ?? null;
  }

  private async toViewForHousehold(
    householdId: string
  ): Promise<SubscriptionView> {
    return this.toView(await this.repo.ensureFreeRow(householdId));
  }

  private async toView(
    sub: Awaited<ReturnType<BillingRepository["ensureFreeRow"]>>
  ): Promise<SubscriptionView> {
    const planLimits = this.limits.limitsForSub(sub);
    const usage = await this.limits.usageSnapshot(sub);
    return {
      householdId: sub.householdId,
      plan: planLimits.plan,
      status: sub.status,
      billingCycle: sub.billingCycle,
      currentPeriodEnd: sub.currentPeriodEnd
        ? sub.currentPeriodEnd.toISOString()
        : null,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      lastPaymentStatus: sub.lastPaymentStatus,
      limits: planLimits,
      usage,
      stripeCustomerId: sub.stripeCustomerId,
    };
  }
}
