import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Subscription } from "./entities/subscription.entity";
import { StripeWebhookEvent } from "./entities/stripe-webhook-event.entity";
import type { UpsertSubscriptionFromStripe } from "./interfaces/billing.interface";

@Injectable()
export class BillingRepository {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptions: Repository<Subscription>,
    @InjectRepository(StripeWebhookEvent)
    private readonly webhookEvents: Repository<StripeWebhookEvent>
  ) {}

  findByHousehold(householdId: string): Promise<Subscription | null> {
    return this.subscriptions.findOne({ where: { householdId } });
  }

  findByStripeCustomerId(
    stripeCustomerId: string
  ): Promise<Subscription | null> {
    return this.subscriptions.findOne({ where: { stripeCustomerId } });
  }

  findByStripeSubscriptionId(
    stripeSubscriptionId: string
  ): Promise<Subscription | null> {
    return this.subscriptions.findOne({ where: { stripeSubscriptionId } });
  }

  async ensureFreeRow(householdId: string): Promise<Subscription> {
    const existing = await this.findByHousehold(householdId);
    if (existing) return existing;
    return this.subscriptions.save(
      this.subscriptions.create({
        householdId,
        plan: "free",
        status: "free",
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        billingCycle: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        lastPaymentStatus: null,
        ocrUsageMonth: null,
        ocrUsageCount: 0,
      })
    );
  }

  async applyStripeState(
    data: UpsertSubscriptionFromStripe
  ): Promise<Subscription> {
    let row =
      (await this.findByHousehold(data.householdId)) ??
      (data.stripeCustomerId
        ? await this.findByStripeCustomerId(data.stripeCustomerId)
        : null) ??
      (data.stripeSubscriptionId
        ? await this.findByStripeSubscriptionId(data.stripeSubscriptionId)
        : null);

    if (!row) {
      row = this.subscriptions.create({
        householdId: data.householdId,
        ocrUsageCount: 0,
        ocrUsageMonth: null,
      });
    }

    row.householdId = data.householdId;
    row.stripeCustomerId = data.stripeCustomerId ?? row.stripeCustomerId;
    row.stripeSubscriptionId =
      data.stripeSubscriptionId ?? row.stripeSubscriptionId;
    row.plan = data.plan;
    row.status = data.status;
    row.billingCycle = data.billingCycle;
    row.currentPeriodEnd = data.currentPeriodEnd;
    row.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
    if (data.lastPaymentStatus !== undefined) {
      row.lastPaymentStatus = data.lastPaymentStatus;
    }
    return this.subscriptions.save(row);
  }

  saveSubscription(sub: Subscription): Promise<Subscription> {
    return this.subscriptions.save(sub);
  }

  /**
   * FR-BILL-003 — claim event for processing.
   * @returns true if this worker should process; false if already seen.
   */
  async claimWebhookEvent(id: string, type: string): Promise<boolean> {
    try {
      await this.webhookEvents.insert({ id, type });
      return true;
    } catch {
      // unique violation → already processed
      return false;
    }
  }

  async wasWebhookProcessed(id: string): Promise<boolean> {
    const row = await this.webhookEvents.findOne({ where: { id } });
    return Boolean(row);
  }
}
