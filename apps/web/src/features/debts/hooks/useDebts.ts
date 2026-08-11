"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debtsApi } from "../api/debts.api";
import type { CreateDebtInput } from "../types/debt.types";
import { useHouseholdStore } from "@/stores/use-household-store";

export function useDebts() {
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey: ["debts", householdId],
    queryFn: () => debtsApi.list(),
    enabled: Boolean(householdId),
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useMutation({
    mutationFn: (input: CreateDebtInput) => debtsApi.create(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["debts", householdId] });
    },
  });
}
