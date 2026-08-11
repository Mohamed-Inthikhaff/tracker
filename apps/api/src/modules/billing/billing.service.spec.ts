import { ForbiddenException } from "@nestjs/common";
import { BillingService } from "./billing.service";
import { BillingLimitsService } from "./billing-limits.service";
import type { BillingRepository } from "./billing.repository";
import type { StripeClient } from "./stripe.client";
import type { HouseholdsRepository } from "../households/households.repository";
import type { TransactionsRepository } from "../transactions/transactions.repository";
import type { ConfigService } from "@nestjs/config";
import type { Subscription } from "./entities/subscription.entity";
import { StripeWebhookService } from "./stripe-webhook.service";

describe("BillingLimitsService (FR-BILL-007)", () => {
  let limits: BillingLimitsService;
  let repo: jest.Mocked<Pick<BillingRepository, "ensureFreeRow">>;
  let transactions: jest.Mocked<
    Pick<TransactionsRepository, "countByHouseholdAndRange">
  >;

  const freeSub: Subscription = {
    id: "sub-row",
    householdId: "11111111-1111-1111-1111-111111111111",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    plan: "free",
    status: "free",
    billingCycle: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    lastPaymentStatus: null,
    ocrUsageMonth: null,
    ocrUsageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repo = {
      ensureFreeRow: jest.fn().mockResolvedValue(freeSub),
    };
    transactions = {
      countByHouseholdAndRange: jest.fn().mockResolvedValue(0),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === "stripe.freeMonthlyTransactions") return 2;
        if (key === "stripe.freeMonthlyOcr") return 0;
        if (key === "stripe.proMonthlyOcr") return 200;
        return undefined;
      }),
    };
    limits = new BillingLimitsService(
      repo as unknown as BillingRepository,
      transactions as unknown as TransactionsRepository,
      config as unknown as ConfigService
    );
  });

  it("blocks free-tier transaction when monthly cap reached", async () => {
    transactions.countByHouseholdAndRange.mockResolvedValue(2);
    await expect(
      limits.assertCanCreateTransaction(freeSub.householdId)
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows transactions under the free cap", async () => {
    transactions.countByHouseholdAndRange.mockResolvedValue(1);
    await expect(
      limits.assertCanCreateTransaction(freeSub.householdId)
    ).resolves.toBeUndefined();
  });
});

describe("BillingService", () => {
  let service: BillingService;
  let repo: jest.Mocked<
    Pick<
      BillingRepository,
      | "ensureFreeRow"
      | "findByHousehold"
      | "saveSubscription"
      | "applyStripeState"
      | "findByStripeCustomerId"
      | "findByStripeSubscriptionId"
    >
  >;
  let stripe: jest.Mocked<
    Pick<
      StripeClient,
      | "isConfigured"
      | "createCustomer"
      | "createCheckoutSession"
      | "priceIdForCycle"
      | "cancelAtPeriodEnd"
      | "listOpenInvoices"
      | "voidInvoice"
      | "cancelImmediately"
    >
  >;
  let households: jest.Mocked<
    Pick<
      HouseholdsRepository,
      | "findUserByAuth0Sub"
      | "findHouseholdById"
      | "findActiveMembership"
    >
  >;
  let limitSvc: BillingLimitsService;

  const householdId = "11111111-1111-1111-1111-111111111111";
  const userId = "22222222-2222-2222-2222-222222222222";
  const auth0Sub = "auth0|owner";

  const freeSub: Subscription = {
    id: "sub-row",
    householdId,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    plan: "free",
    status: "free",
    billingCycle: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    lastPaymentStatus: null,
    ocrUsageMonth: null,
    ocrUsageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repo = {
      ensureFreeRow: jest.fn().mockResolvedValue(freeSub),
      findByHousehold: jest.fn().mockResolvedValue(freeSub),
      saveSubscription: jest.fn(async (s) => s),
      applyStripeState: jest.fn(),
      findByStripeCustomerId: jest.fn(),
      findByStripeSubscriptionId: jest.fn(),
    };
    stripe = {
      isConfigured: jest.fn().mockReturnValue(true),
      createCustomer: jest.fn(),
      createCheckoutSession: jest.fn(),
      priceIdForCycle: jest.fn().mockReturnValue("price_month"),
      cancelAtPeriodEnd: jest.fn(),
      listOpenInvoices: jest.fn().mockResolvedValue([]),
      voidInvoice: jest.fn(),
      cancelImmediately: jest.fn(),
    };
    households = {
      findUserByAuth0Sub: jest.fn().mockResolvedValue({
        id: userId,
        auth0Sub,
        email: "owner@example.com",
        displayName: "Owner",
      }),
      findHouseholdById: jest.fn().mockResolvedValue({
        id: householdId,
        name: "Home",
      }),
      findActiveMembership: jest.fn().mockResolvedValue({
        role: "Owner",
        userId,
        householdId,
      }),
    };
    const config = {
      get: jest.fn((key: string) => {
        if (key === "stripe.freeMonthlyTransactions") return 2;
        if (key === "stripe.freeMonthlyOcr") return 0;
        if (key === "stripe.proMonthlyOcr") return 200;
        return undefined;
      }),
    };
    const transactions = {
      countByHouseholdAndRange: jest.fn().mockResolvedValue(0),
    };
    limitSvc = new BillingLimitsService(
      repo as unknown as BillingRepository,
      transactions as unknown as TransactionsRepository,
      config as unknown as ConfigService
    );
    service = new BillingService(
      repo as unknown as BillingRepository,
      stripe as unknown as StripeClient,
      households as unknown as HouseholdsRepository,
      limitSvc
    );
  });

  it("creates checkout session for owner (FR-BILL-002)", async () => {
    stripe.createCustomer.mockResolvedValue({ id: "cus_1" } as never);
    stripe.createCheckoutSession.mockResolvedValue({
      url: "https://checkout.stripe.com/test",
    } as never);

    const result = await service.createCheckoutSession(householdId, auth0Sub, {
      cycle: "monthly",
      successUrl: "https://app.example/ok",
      cancelUrl: "https://app.example/cancel",
    });

    expect(stripe.createCustomer).toHaveBeenCalled();
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("syncs paid plan from Stripe subscription", async () => {
    const stripeSub = {
      id: "sub_1",
      customer: "cus_1",
      status: "active",
      cancel_at_period_end: false,
      metadata: { householdId },
      items: {
        data: [{ price: { recurring: { interval: "month" } } }],
      },
      current_period_end: Math.floor(Date.now() / 1000) + 86400,
    };
    repo.applyStripeState.mockResolvedValue({
      ...freeSub,
      plan: "pro",
      status: "active",
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
      billingCycle: "monthly",
      currentPeriodEnd: new Date(Date.now() + 86400_000),
    });

    const view = await service.syncFromStripeSubscription(stripeSub as never);
    expect(repo.applyStripeState).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        plan: "pro",
        status: "active",
      })
    );
    expect(view.limits.plan).toBe("pro");
    expect(view.limits.monthlyTransactionLimit).toBeNull();
  });

  it("voids invoices on account deletion prep (FR-BILL-006)", async () => {
    repo.findByHousehold.mockResolvedValue({
      ...freeSub,
      stripeCustomerId: "cus_1",
      stripeSubscriptionId: "sub_1",
    });
    stripe.listOpenInvoices.mockResolvedValue([{ id: "in_1" }] as never);

    await service.prepareAccountDeletion(householdId);
    expect(stripe.voidInvoice).toHaveBeenCalledWith("in_1");
    expect(stripe.cancelImmediately).toHaveBeenCalledWith("sub_1");
  });
});

describe("StripeWebhookService", () => {
  let webhooks: StripeWebhookService;
  let stripe: {
    constructWebhookEvent: jest.Mock;
    retrieveSubscription: jest.Mock;
  };
  let repo: {
    wasWebhookProcessed: jest.Mock;
    claimWebhookEvent: jest.Mock;
    findByStripeCustomerId: jest.Mock;
  };
  let billing: {
    syncFromStripeSubscription: jest.Mock;
    markLastPayment: jest.Mock;
  };

  beforeEach(() => {
    stripe = {
      constructWebhookEvent: jest.fn(),
      retrieveSubscription: jest.fn(),
    };
    repo = {
      wasWebhookProcessed: jest.fn().mockResolvedValue(false),
      claimWebhookEvent: jest.fn().mockResolvedValue(true),
      findByStripeCustomerId: jest.fn(),
    };
    billing = {
      syncFromStripeSubscription: jest.fn(),
      markLastPayment: jest.fn(),
    };
    webhooks = new StripeWebhookService(
      stripe as never,
      repo as never,
      billing as never
    );
  });

  it("rejects invalid signatures (FR-BILL-003)", async () => {
    stripe.constructWebhookEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });
    await expect(
      webhooks.handleRawEvent(Buffer.from("{}"), "sig")
    ).rejects.toThrow(/Invalid Stripe webhook signature/);
  });

  it("skips duplicate event ids (FR-BILL-003)", async () => {
    repo.wasWebhookProcessed.mockResolvedValue(true);
    stripe.constructWebhookEvent.mockReturnValue({
      id: "evt_1",
      type: "invoice.paid",
      data: { object: {} },
    });
    const result = await webhooks.handleRawEvent(Buffer.from("{}"), "sig");
    expect(result.duplicate).toBe(true);
    expect(billing.syncFromStripeSubscription).not.toHaveBeenCalled();
  });

  it("processes subscription.updated and claims event", async () => {
    const sub = { id: "sub_1", metadata: { householdId: "h1" } };
    stripe.constructWebhookEvent.mockReturnValue({
      id: "evt_2",
      type: "customer.subscription.updated",
      data: { object: sub },
    });
    const result = await webhooks.handleRawEvent(Buffer.from("{}"), "sig");
    expect(billing.syncFromStripeSubscription).toHaveBeenCalledWith(sub);
    expect(repo.claimWebhookEvent).toHaveBeenCalledWith(
      "evt_2",
      "customer.subscription.updated"
    );
    expect(result.received).toBe(true);
  });
});
