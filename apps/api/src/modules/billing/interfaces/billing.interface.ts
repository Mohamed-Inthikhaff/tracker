import type {
  BillingCycle,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@expense-tracker/types";

export interface PlanLimitsView {
  plan: SubscriptionPlan;
  monthlyTransactionLimit: number | null;
  monthlyOcrLimit: number | null;
  smsCapture: boolean;
  extendedTrendMonths: number;
  receiptOcr: boolean;
}

export interface SubscriptionView {
  householdId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  lastPaymentStatus: "ok" | "failed" | null;
  /** Effective entitlements after period / dunning rules. */
  limits: PlanLimitsView;
  usage: {
    month: string;
    transactionsCreated: number;
    ocrScans: number;
  };
  stripeCustomerId: string | null;
}

export interface UpsertSubscriptionFromStripe {
  householdId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: BillingCycle | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  lastPaymentStatus?: "ok" | "failed" | null;
}
