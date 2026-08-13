"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "../api/transactions.api";
import type { UpdateTransactionInput } from "../types/transaction.types";
import { useHouseholdStore } from "@/stores/use-household-store";

function invalidateTxnQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  householdId: string | null
) {
  void queryClient.invalidateQueries({ queryKey: ["transactions", householdId] });
  void queryClient.invalidateQueries({
    queryKey: ["transactions", "summary", householdId],
  });
  void queryClient.invalidateQueries({ queryKey: ["debts", householdId] });
  void queryClient.invalidateQueries({ queryKey: ["budgets", householdId] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: UpdateTransactionInput;
    }) => transactionsApi.update(id, input),
    onSettled: () => invalidateTxnQueries(queryClient, householdId),
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);

  return useMutation({
    mutationFn: (id: string) => transactionsApi.delete(id),
    onSettled: () => invalidateTxnQueries(queryClient, householdId),
  });
}
