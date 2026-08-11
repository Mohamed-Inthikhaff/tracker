"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "../api/transactions.api";
import type { TransactionListParams } from "../types/transaction.types";
import { useHouseholdStore } from "@/stores/use-household-store";

export function useTransactions(params: TransactionListParams = {}) {
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);

  return useQuery({
    queryKey: ["transactions", householdId, params],
    queryFn: () => transactionsApi.list(params),
    enabled: Boolean(householdId),
  });
}
