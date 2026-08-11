import type { CategoryType } from "@expense-tracker/types";

export interface CategoryView {
  id: string;
  householdId: string;
  name: string;
  type: CategoryType;
  parentCategoryId: string | null;
  isSystemDefault: boolean;
  isActive: boolean;
  sortOrder: number;
}
