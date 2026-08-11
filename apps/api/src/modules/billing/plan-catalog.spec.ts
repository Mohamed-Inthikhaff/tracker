import {
  currentMonthKey,
  freePlanLimits,
  hasPaidAccess,
  monthDateBounds,
  proPlanLimits,
} from "./plan-catalog";
import { mapStripeStatus } from "./stripe-subscription.mapper";

describe("plan-catalog", () => {
  it("hasPaidAccess covers active, past_due, and cancel grace (FR-BILL-004/005)", () => {
    expect(
      hasPaidAccess({ status: "active", currentPeriodEnd: null })
    ).toBe(true);
    expect(
      hasPaidAccess({ status: "past_due", currentPeriodEnd: null })
    ).toBe(true);
    expect(
      hasPaidAccess({
        status: "canceled",
        currentPeriodEnd: new Date(Date.now() + 86_400_000),
      })
    ).toBe(true);
    expect(
      hasPaidAccess({
        status: "canceled",
        currentPeriodEnd: new Date(Date.now() - 86_400_000),
      })
    ).toBe(false);
    expect(hasPaidAccess({ status: "free", currentPeriodEnd: null })).toBe(
      false
    );
  });

  it("defines free vs pro limits (FR-BILL-001)", () => {
    expect(freePlanLimits(100, 0).monthlyTransactionLimit).toBe(100);
    expect(freePlanLimits(100, 0).smsCapture).toBe(false);
    expect(proPlanLimits(200).monthlyTransactionLimit).toBeNull();
    expect(proPlanLimits(200).receiptOcr).toBe(true);
  });

  it("month helpers", () => {
    expect(currentMonthKey(new Date("2026-08-15T12:00:00Z"))).toBe("2026-08");
    const { start, endInclusive } = monthDateBounds("2026-02");
    expect(start.toISOString().startsWith("2026-02-01")).toBe(true);
    expect(endInclusive.getUTCDate()).toBe(28);
  });
});

describe("mapStripeStatus", () => {
  it("maps Stripe statuses", () => {
    expect(mapStripeStatus("active")).toBe("active");
    expect(mapStripeStatus("past_due")).toBe("past_due");
    expect(mapStripeStatus("canceled")).toBe("canceled");
  });
});
