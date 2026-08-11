import { apiClient } from "@/lib/api-client";
import type {
  CreateDebtInput,
  Debt,
  DebtHouseholdTotals,
} from "../types/debt.types";

export const debtsApi = {
  list: () => apiClient.get<DebtHouseholdTotals>("/debts"),

  create: (input: CreateDebtInput) =>
    apiClient.post<Debt>("/debts", {
      ...input,
      openedDate:
        input.openedDate instanceof Date
          ? input.openedDate.toISOString()
          : input.openedDate,
    }),
};
