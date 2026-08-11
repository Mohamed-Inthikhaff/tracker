export type BudgetHealth = "Under" | "Near" | "Over";

export interface BudgetLine {
  id: string;
  householdId: string;
  categoryId: string;
  categoryName: string;
  month: string;
  budgetedAmount: string;
  actualAmount: string;
  variance: string;
  percentOfBudgetUsed: number | null;
  health: BudgetHealth;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetMonthSummary {
  month: string;
  dateFrom: string;
  dateTo: string;
  lines: BudgetLine[];
  totalBudgeted: string;
  totalActual: string;
  totalIncome: string;
  savingsRateVsBudgeted: number | null;
  savingsRateVsActual: number | null;
}

export interface SetBudgetInput {
  categoryId: string;
  month: string;
  budgetedAmount: string;
}

export interface CopyBudgetMonthInput {
  fromMonth: string;
  toMonth: string;
}
