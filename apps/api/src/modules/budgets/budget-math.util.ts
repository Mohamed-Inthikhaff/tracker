import type { BudgetHealth } from "@expense-tracker/types";

/** Near threshold = 90% used (under that = Under, above 100% = Over). */
export const BUDGET_NEAR_PERCENT = 90;

/**
 * FR-BUD-003 / FR-BUD-004 — variance, percent used, traffic-light health.
 * variance = actual − budgeted (positive = overspent).
 * percentOfBudgetUsed: null when budgeted is 0 (avoid div-by-zero).
 */
export function computeBudgetLine(
  budgeted: string,
  actual: string,
  nearPercent: number = BUDGET_NEAR_PERCENT
): {
  variance: string;
  percentOfBudgetUsed: number | null;
  health: BudgetHealth;
} {
  const b = parseMoney(budgeted);
  const a = parseMoney(actual);
  const variance = fromCents(a - b);

  if (b <= 0) {
    // No meaningful budget: treated as over if any spend, else under
    return {
      variance,
      percentOfBudgetUsed: null,
      health: a > 0 ? "Over" : "Under",
    };
  }

  const pct = (a / b) * 100;
  let health: BudgetHealth;
  if (pct > 100) health = "Over";
  else if (pct >= nearPercent) health = "Near";
  else health = "Under";

  return {
    variance,
    percentOfBudgetUsed: Math.round(pct * 10) / 10,
    health,
  };
}

/**
 * FR-BUD-005 — savings rates vs budgeted and actual total expense.
 * rate = (income − expense) / income * 100; null when income is 0.
 */
export function computeSavingsRates(
  income: string,
  budgetedExpenseTotal: string,
  actualExpenseTotal: string
): {
  savingsRateVsBudgeted: number | null;
  savingsRateVsActual: number | null;
} {
  const inc = parseMoney(income);
  if (inc <= 0) {
    return { savingsRateVsBudgeted: null, savingsRateVsActual: null };
  }
  const vsBudget = ((inc - parseMoney(budgetedExpenseTotal)) / inc) * 100;
  const vsActual = ((inc - parseMoney(actualExpenseTotal)) / inc) * 100;
  return {
    savingsRateVsBudgeted: Math.round(vsBudget * 10) / 10,
    savingsRateVsActual: Math.round(vsActual * 10) / 10,
  };
}

/** Last day of YYYY-MM as YYYY-MM-DD (UTC calendar). */
export function monthRange(month: string): {
  start: string;
  endInclusive: string;
} {
  const [y, m] = month.split("-").map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const endInclusive = `${month}-${String(lastDay).padStart(2, "0")}`;
  return { start, endInclusive };
}

export function previousMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function addMoney(a: string, b: string): string {
  return fromCents(parseMoney(a) + parseMoney(b));
}

function parseMoney(value: string): number {
  const n = Math.round(Number(value) * 100);
  if (!Number.isFinite(n)) return 0;
  return n;
}

function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
