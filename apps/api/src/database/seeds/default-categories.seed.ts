import type { CategoryType } from "@expense-tracker/types";

/**
 * Default category list seeded for every new household (FR-CAT-001).
 * Kept here — not inline in CategoriesService — so the taxonomy is editable
 * without touching business logic, and so CSV-import mapping can reference it.
 *
 * Types align with the spreadsheet's Income / Expense / Saving / Debt Given /
 * Debt Received vocabulary.
 */
export interface DefaultCategorySeed {
  name: string;
  type: CategoryType;
  /** Optional parent name within this same seed list (same type). */
  parentName?: string;
  sortOrder: number;
}

export const DEFAULT_CATEGORY_SEEDS: readonly DefaultCategorySeed[] = [
  // Income
  { name: "Salary", type: "Income", sortOrder: 10 },
  { name: "Freelance", type: "Income", sortOrder: 20 },
  { name: "Investments", type: "Income", sortOrder: 30 },
  { name: "Other Income", type: "Income", sortOrder: 40 },

  // Expense — top-level
  { name: "Housing", type: "Expense", sortOrder: 100 },
  {
    name: "Rent / Mortgage",
    type: "Expense",
    parentName: "Housing",
    sortOrder: 110,
  },
  { name: "Utilities", type: "Expense", parentName: "Housing", sortOrder: 120 },
  { name: "Food", type: "Expense", sortOrder: 200 },
  { name: "Groceries", type: "Expense", parentName: "Food", sortOrder: 210 },
  { name: "Dining Out", type: "Expense", parentName: "Food", sortOrder: 220 },
  { name: "Transport", type: "Expense", sortOrder: 300 },
  { name: "Fuel", type: "Expense", parentName: "Transport", sortOrder: 310 },
  {
    name: "Public Transit",
    type: "Expense",
    parentName: "Transport",
    sortOrder: 320,
  },
  { name: "Healthcare", type: "Expense", sortOrder: 400 },
  { name: "Entertainment", type: "Expense", sortOrder: 500 },
  { name: "Shopping", type: "Expense", sortOrder: 600 },
  { name: "Subscriptions", type: "Expense", sortOrder: 700 },
  { name: "Education", type: "Expense", sortOrder: 800 },
  { name: "Personal Care", type: "Expense", sortOrder: 900 },
  { name: "Travel", type: "Expense", sortOrder: 1000 },
  { name: "Misc", type: "Expense", sortOrder: 1100 },

  // Saving
  { name: "Emergency Fund", type: "Saving", sortOrder: 10 },
  { name: "Investments", type: "Saving", sortOrder: 20 },
  { name: "Goals", type: "Saving", sortOrder: 30 },

  // Debt given (money lent)
  { name: "Loan to Family", type: "DebtGiven", sortOrder: 10 },
  { name: "Loan to Friend", type: "DebtGiven", sortOrder: 20 },
  { name: "Other Loan Given", type: "DebtGiven", sortOrder: 30 },

  // Debt received (money borrowed)
  { name: "Loan from Family", type: "DebtReceived", sortOrder: 10 },
  { name: "Loan from Friend", type: "DebtReceived", sortOrder: 20 },
  { name: "Other Loan Received", type: "DebtReceived", sortOrder: 30 },
] as const;

export interface SeedCategoryRow {
  householdId: string;
  name: string;
  type: CategoryType;
  parentName?: string;
  sortOrder: number;
  isSystemDefault: true;
  isActive: true;
}

/** Expand seeds into insertable rows for a household (parents before children). */
export function buildDefaultCategoryRows(
  householdId: string
): SeedCategoryRow[] {
  const roots = DEFAULT_CATEGORY_SEEDS.filter((s) => !s.parentName);
  const children = DEFAULT_CATEGORY_SEEDS.filter((s) => s.parentName);
  return [...roots, ...children].map((seed) => ({
    householdId,
    name: seed.name,
    type: seed.type,
    parentName: seed.parentName,
    sortOrder: seed.sortOrder,
    isSystemDefault: true as const,
    isActive: true as const,
  }));
}
