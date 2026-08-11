import {
  computeBudgetLine,
  computeSavingsRates,
  monthRange,
  previousMonth,
} from "./budget-math.util";

describe("budget-math.util", () => {
  describe("computeBudgetLine (FR-BUD-003 / 004)", () => {
    it("Under when well below budget", () => {
      expect(computeBudgetLine("100.00", "50.00")).toEqual({
        variance: "-50.00",
        percentOfBudgetUsed: 50,
        health: "Under",
      });
    });

    it("Near at default 90% threshold", () => {
      expect(computeBudgetLine("100.00", "90.00").health).toBe("Near");
      expect(computeBudgetLine("100.00", "95.00").health).toBe("Near");
    });

    it("Over when actual exceeds budget", () => {
      expect(computeBudgetLine("100.00", "100.01")).toEqual({
        variance: "0.01",
        percentOfBudgetUsed: 100,
        health: "Over",
      });
      // exact 100% is Near boundary — still not overspent
      expect(computeBudgetLine("100.00", "100.00").health).toBe("Near");
    });
  });

  describe("computeSavingsRates (FR-BUD-005)", () => {
    it("compares income vs budgeted and actual expense", () => {
      expect(
        computeSavingsRates("1000.00", "600.00", "700.00")
      ).toEqual({
        savingsRateVsBudgeted: 40,
        savingsRateVsActual: 30,
      });
    });

    it("returns null rates when income is zero", () => {
      expect(computeSavingsRates("0.00", "100.00", "50.00")).toEqual({
        savingsRateVsBudgeted: null,
        savingsRateVsActual: null,
      });
    });
  });

  describe("month helpers", () => {
    it("monthRange returns inclusive calendar bounds", () => {
      expect(monthRange("2026-02")).toEqual({
        start: "2026-02-01",
        endInclusive: "2026-02-28",
      });
      expect(monthRange("2024-02")).toEqual({
        start: "2024-02-01",
        endInclusive: "2024-02-29",
      });
    });

    it("previousMonth rolls year correctly", () => {
      expect(previousMonth("2026-01")).toBe("2025-12");
      expect(previousMonth("2026-03")).toBe("2026-02");
    });
  });
});
