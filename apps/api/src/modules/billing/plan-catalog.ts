import type { SubscriptionPlan } from "@expense-tracker/types";

/** Feature / usage caps per plan (FR-BILL-001, FR-BILL-007). */
export interface PlanLimits {
  plan: SubscriptionPlan;
  /** null = unlimited. */
  monthlyTransactionLimit: number | null;
  monthlyOcrLimit: number | null;
  smsCapture: boolean;
  /** Dashboard trend history depth. */
  extendedTrendMonths: number;
  receiptOcr: boolean;
}

export function freePlanLimits(
  monthlyTx: number,
  monthlyOcr: number
): PlanLimits {
  return {
    plan: "free",
    monthlyTransactionLimit: monthlyTx,
    monthlyOcrLimit: monthlyOcr,
    smsCapture: false,
    extendedTrendMonths: 3,
    receiptOcr: monthlyOcr > 0,
  };
}

export function proPlanLimits(monthlyOcr: number): PlanLimits {
  return {
    plan: "pro",
    monthlyTransactionLimit: null,
    monthlyOcrLimit: monthlyOcr,
    smsCapture: true,
    extendedTrendMonths: 24,
    receiptOcr: true,
  };
}

/**
 * Paid entitlements while Stripe reports an active / trialing / past_due sub,
 * or while canceled-but-still-in-period (FR-BILL-004 / FR-BILL-005).
 */
export function hasPaidAccess(opts: {
  status: string;
  currentPeriodEnd: Date | null;
  now?: Date;
}): boolean {
  const now = opts.now ?? new Date();
  if (
    opts.status === "active" ||
    opts.status === "trialing" ||
    opts.status === "past_due"
  ) {
    return true;
  }
  if (
    opts.status === "canceled" &&
    opts.currentPeriodEnd &&
    opts.currentPeriodEnd.getTime() > now.getTime()
  ) {
    return true;
  }
  return false;
}

export function currentMonthKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthDateBounds(monthKey: string): {
  start: Date;
  endInclusive: Date;
} {
  const [y, m] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const endInclusive = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
  return { start, endInclusive };
}
