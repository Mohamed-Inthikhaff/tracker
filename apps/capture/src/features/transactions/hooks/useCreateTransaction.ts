"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoriesApi, transactionsApi } from "../api/transactions.api";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionType,
} from "../types/transaction.types";
import { useHouseholdStore } from "@/stores/use-household-store";

export function useCategories(type: TransactionType = "Expense") {
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey: ["categories", householdId, type],
    queryFn: () => categoriesApi.list(type),
    enabled: Boolean(householdId),
  });
}

/**
 * Optimistic create so quick-add feels instant (NFR-PERF-001 / FR-TXN-002).
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);

  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      transactionsApi.create(input),
    onMutate: async (newTxn) => {
      const key = ["quick-add", householdId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Transaction[]>(key);
      const optimistic: Transaction = {
        id: `optimistic-${Date.now()}`,
        householdId: householdId ?? "",
        categoryId: newTxn.categoryId ?? "",
        date:
          newTxn.date instanceof Date
            ? newTxn.date.toISOString().slice(0, 10)
            : String(newTxn.date).slice(0, 10),
        type: newTxn.type,
        amount: newTxn.amount,
        description: newTxn.description ?? null,
        payee: newTxn.payee ?? null,
        source: newTxn.source ?? "manual",
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<Transaction[]>(key, (old) => [
        optimistic,
        ...(old ?? []),
      ]);
      return { previous };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["quick-add", householdId], ctx?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["quick-add", householdId] });
    },
  });
}

export function useRecentQuickAdds() {
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey: ["quick-add", householdId],
    queryFn: async () => [] as Transaction[],
    enabled: Boolean(householdId),
    staleTime: Infinity,
  });
}
