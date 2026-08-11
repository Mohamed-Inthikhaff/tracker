export type CategoryType =
  | "Income"
  | "Expense"
  | "Saving"
  | "DebtGiven"
  | "DebtReceived";

export interface Category {
  id: string;
  householdId: string;
  name: string;
  type: CategoryType;
  parentCategoryId: string | null;
  isSystemDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}
