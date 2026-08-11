"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { budgetsApi } from "../api/budgets.api";
import type {
  CopyBudgetMonthInput,
  SetBudgetInput,
} from "../types/budget.types";
import { useHouseholdStore } from "@/stores/use-household-store";

export function useBudgetMonth(month: string) {
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey: ["budgets", householdId, month],
    queryFn: () => budgetsApi.getMonth(month),
    enabled: Boolean(householdId && month),
  });
}

export function useSetBudget(month: string) {
  const queryClient = useQueryClient();
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useMutation({
    mutationFn: (input: SetBudgetInput) => budgetsApi.set(input),
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["budgets", householdId, month],
      });
    },
  });
}

export function useCopyBudgetMonth() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useMutation({
    mutationFn: (input: CopyBudgetMonthInput) => budgetsApi.copy(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["budgets", householdId, data.month],
      });
    },
  });
}
