import type { BudgetHealth } from "@expense-tracker/types";

export interface BudgetLineView {
  id: string;
  householdId: string;
  categoryId: string;
  categoryName: string;
  month: string;
  /** Decimal string. */
  budgetedAmount: string;
  /** Live SUM of Expense txns in this category/month (FR-BUD-002). */
  actualAmount: string;
  /** actual − budgeted (FR-BUD-003). */
  variance: string;
  /** 0–100+; null if budgeted is 0. */
  percentOfBudgetUsed: number | null;
  /** Under | Near | Over (FR-BUD-004). */
  health: BudgetHealth;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetMonthSummary {
  month: string;
  dateFrom: string;
  dateTo: string;
  lines: BudgetLineView[];
  totalBudgeted: string;
  totalActual: string;
  /** Total Income for the month. */
  totalIncome: string;
  /** FR-BUD-005 — %; null when income is 0. */
  savingsRateVsBudgeted: number | null;
  savingsRateVsActual: number | null;
}

export interface CreateBudgetData {
  householdId: string;
  categoryId: string;
  month: string;
  budgetedAmount: string;
}
