import { apiClient } from "@/lib/api-client";
import type {
  BudgetLine,
  BudgetMonthSummary,
  CopyBudgetMonthInput,
  SetBudgetInput,
} from "../types/budget.types";

export const budgetsApi = {
  getMonth: (month: string) =>
    apiClient.get<BudgetMonthSummary>("/budgets", {
      params: { month },
    }),

  set: (input: SetBudgetInput) =>
    apiClient.put<BudgetLine>("/budgets", input),

  copy: (input: CopyBudgetMonthInput) =>
    apiClient.post<BudgetMonthSummary>("/budgets/copy", input),
};
