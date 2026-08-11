import {
  balanceFromAmounts,
  isTxnInDebtWindow,
  repaymentTypeForDirection,
} from "./debt-window.util";

describe("debt-window.util", () => {
  describe("repaymentTypeForDirection", () => {
    it("maps IOwe → DebtGiven (repayment out)", () => {
      expect(repaymentTypeForDirection("IOwe")).toBe("DebtGiven");
    });
    it("maps OwedToMe → DebtReceived (recovery in)", () => {
      expect(repaymentTypeForDirection("OwedToMe")).toBe("DebtReceived");
    });
  });

  describe("isTxnInDebtWindow (FR-DEBT-002 / 004)", () => {
    it("includes start, excludes next open date", () => {
      expect(isTxnInDebtWindow("2026-01-10", "2026-01-01", "2026-02-01")).toBe(
        true
      );
      expect(isTxnInDebtWindow("2026-01-01", "2026-01-01", "2026-02-01")).toBe(
        true
      );
      expect(isTxnInDebtWindow("2026-02-01", "2026-01-01", "2026-02-01")).toBe(
        false
      );
      expect(isTxnInDebtWindow("2025-12-31", "2026-01-01", "2026-02-01")).toBe(
        false
      );
    });

    it("open-ended when no next debt", () => {
      expect(isTxnInDebtWindow("2027-01-01", "2026-01-01", null)).toBe(true);
    });
  });

  describe("balanceFromAmounts (FR-DEBT-003 / 005)", () => {
    it("Outstanding when none repaid", () => {
      expect(balanceFromAmounts("100.00", "0.00")).toEqual({
        repaidSoFar: "0.00",
        remaining: "100.00",
        status: "Outstanding",
      });
    });
    it("PartiallyPaid when some repaid", () => {
      expect(balanceFromAmounts("100.00", "40.50")).toEqual({
        repaidSoFar: "40.50",
        remaining: "59.50",
        status: "PartiallyPaid",
      });
    });
    it("Settled when fully or over-repaid", () => {
      expect(balanceFromAmounts("100.00", "100.00").status).toBe("Settled");
      expect(balanceFromAmounts("100.00", "120.00")).toEqual({
        repaidSoFar: "120.00",
        remaining: "0.00",
        status: "Settled",
      });
    });
  });
});
