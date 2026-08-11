"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { transactionsApi } from "../api/transactions.api";
import { useHouseholdStore } from "@/stores/use-household-store";
import type {
  CreateTransactionInput,
  TransactionListResult,
} from "../types/transaction.types";

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);

  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      transactionsApi.create(input),
    onMutate: async (newTxn) => {
      const key = ["transactions", householdId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueriesData<TransactionListResult>({
        queryKey: key,
      });
      queryClient.setQueriesData<TransactionListResult>({ queryKey: key }, (old) => {
        if (!old) return old;
        if (!newTxn.categoryId) return old;
        const optimistic = {
          id: `optimistic-${Date.now()}`,
          householdId: householdId ?? "",
          categoryId: newTxn.categoryId,
          createdByUserId: "me",
          date:
            newTxn.date instanceof Date
              ? newTxn.date.toISOString().slice(0, 10)
              : String(newTxn.date).slice(0, 10),
          type: newTxn.type,
          amount: newTxn.amount,
          currency: "—",
          description: newTxn.description ?? null,
          payee: newTxn.payee ?? null,
          notes: newTxn.notes ?? null,
          source: newTxn.source ?? "manual",
          aiConfidence: null,
          userConfirmedCategory: true,
          createdAt: new Date().toISOString(),
        };
        return {
          ...old,
          total: old.total + 1,
          items: [optimistic, ...old.items],
        };
      });
      return { previous };
    },
    onError: (_err, _newTxn, context) => {
      context?.previous?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions", householdId],
      });
    },
  });
}
