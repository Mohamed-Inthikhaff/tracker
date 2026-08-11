import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";

/**
 * Sole Stripe SDK touchpoint (mirrors gemini-classification.client isolation).
 */
@Injectable()
export class StripeClient {
  private readonly stripe: Stripe | null;
  private readonly webhookSecret: string;

  constructor(private readonly config: ConfigService) {
    const key = this.config.get<string>("stripe.secretKey") ?? "";
    this.webhookSecret =
      this.config.get<string>("stripe.webhookSecret") ?? "";
    this.stripe = key
      ? new Stripe(key, { apiVersion: "2025-02-24.acacia" })
      : null;
  }

  isConfigured(): boolean {
    return Boolean(this.stripe);
  }

  private requireClient(): Stripe {
    if (!this.stripe) {
      throw new ServiceUnavailableException(
        "Stripe is not configured (STRIPE_SECRET_KEY)"
      );
    }
    return this.stripe;
  }

  constructWebhookEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.webhookSecret) {
      throw new ServiceUnavailableException(
        "STRIPE_WEBHOOK_SECRET is not configured"
      );
    }
    return this.requireClient().webhooks.constructEvent(
      rawBody,
      signature,
      this.webhookSecret
    );
  }

  async createCustomer(opts: {
    email: string;
    name: string;
    householdId: string;
  }): Promise<Stripe.Customer> {
    return this.requireClient().customers.create(
      {
        email: opts.email,
        name: opts.name,
        metadata: { householdId: opts.householdId },
      },
      { idempotencyKey: `cust_${opts.householdId}` }
    );
  }

  async createCheckoutSession(opts: {
    customerId: string;
    priceId: string;
    householdId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    return this.requireClient().checkout.sessions.create(
      {
        mode: "subscription",
        customer: opts.customerId,
        line_items: [{ price: opts.priceId, quantity: 1 }],
        success_url: opts.successUrl,
        cancel_url: opts.cancelUrl,
        client_reference_id: opts.householdId,
        metadata: { householdId: opts.householdId },
        subscription_data: {
          metadata: { householdId: opts.householdId },
        },
      },
      {
        idempotencyKey: `checkout_${opts.householdId}_${opts.priceId}_${Date.now()}`,
      }
    );
  }

  async createBillingPortalSession(opts: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    return this.requireClient().billingPortal.sessions.create({
      customer: opts.customerId,
      return_url: opts.returnUrl,
    });
  }

  async cancelAtPeriodEnd(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    return this.requireClient().subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  async cancelImmediately(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    return this.requireClient().subscriptions.cancel(subscriptionId);
  }

  async listOpenInvoices(customerId: string): Promise<Stripe.Invoice[]> {
    const page = await this.requireClient().invoices.list({
      customer: customerId,
      status: "open",
      limit: 100,
    });
    return page.data;
  }

  async voidInvoice(invoiceId: string): Promise<Stripe.Invoice> {
    return this.requireClient().invoices.voidInvoice(invoiceId);
  }

  async retrieveSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    return this.requireClient().subscriptions.retrieve(subscriptionId);
  }

  priceIdForCycle(cycle: "monthly" | "annual"): string {
    const id =
      cycle === "monthly"
        ? this.config.get<string>("stripe.priceMonthly")
        : this.config.get<string>("stripe.priceAnnual");
    if (!id) {
      throw new ServiceUnavailableException(
        `Stripe price not configured for ${cycle} cycle`
      );
    }
    return id;
  }
}
