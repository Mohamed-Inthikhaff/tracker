import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import type Stripe from "stripe";
import { BillingRepository } from "./billing.repository";
import { BillingService } from "./billing.service";
import { customerIdOf } from "./stripe-subscription.mapper";
import { StripeClient } from "./stripe.client";

/**
 * Stripe webhook pipeline (FR-BILL-003 / NFR-SEC-004):
 * verify signature → process (idempotent apply) → record event id.
 * Apply is upsert-safe so a concurrent double delivery cannot corrupt state.
 */
@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly stripe: StripeClient,
    private readonly repo: BillingRepository,
    private readonly billing: BillingService
  ) {}

  async handleRawEvent(
    rawBody: Buffer,
    signatureHeader: string | undefined
  ): Promise<{ received: true; duplicate?: boolean }> {
    if (!signatureHeader) {
      throw new UnauthorizedException("Missing Stripe-Signature header");
    }
    if (!Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      throw new BadRequestException("Empty webhook body");
    }

    let event: Stripe.Event;
    try {
      event = this.stripe.constructWebhookEvent(rawBody, signatureHeader);
    } catch (err) {
      this.logger.warn(
        `Webhook signature verification failed: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
      throw new UnauthorizedException("Invalid Stripe webhook signature");
    }

    if (await this.repo.wasWebhookProcessed(event.id)) {
      return { received: true, duplicate: true };
    }

    await this.dispatch(event);
    await this.repo.claimWebhookEvent(event.id, event.type);
    return { received: true };
  }

  private async dispatch(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id;
        const householdId =
          session.metadata?.householdId ||
          session.client_reference_id ||
          undefined;
        if (subId) {
          const stripeSub = await this.stripe.retrieveSubscription(subId);
          await this.billing.syncFromStripeSubscription(
            stripeSub,
            householdId ?? undefined
          );
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await this.billing.syncFromStripeSubscription(
          event.data.object as Stripe.Subscription
        );
        break;
      }
      case "invoice.payment_failed":
        await this.markPayment(event.data.object as Stripe.Invoice, "failed");
        break;
      case "invoice.paid":
        await this.markPayment(event.data.object as Stripe.Invoice, "ok");
        break;
      default:
        this.logger.debug(`Ignoring unhandled Stripe event ${event.type}`);
    }
  }

  private async markPayment(
    invoice: Stripe.Invoice,
    outcome: "ok" | "failed"
  ): Promise<void> {
    const customerId = customerIdOf(
      invoice.customer as string | Stripe.Customer | null
    );
    if (!customerId) return;

    const sub = await this.repo.findByStripeCustomerId(customerId);
    if (!sub) return;

    await this.billing.markLastPayment(sub.householdId, outcome);

    const invSub = (
      invoice as { subscription?: string | { id: string } | null }
    ).subscription;
    const subId =
      typeof invSub === "string" ? invSub : invSub?.id ?? null;
    if (subId) {
      const stripeSub = await this.stripe.retrieveSubscription(subId);
      await this.billing.syncFromStripeSubscription(
        stripeSub,
        sub.householdId
      );
      await this.billing.markLastPayment(sub.householdId, outcome);
    }
  }
}
