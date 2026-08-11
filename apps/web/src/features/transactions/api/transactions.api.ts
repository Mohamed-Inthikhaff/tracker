import { apiClient } from "@/lib/api-client";
import type {
  CreateTransactionInput,
  MonthlyTotalsSummary,
  Transaction,
  TransactionListParams,
  TransactionListResult,
} from "../types/transaction.types";

export const transactionsApi = {
  list: (params: TransactionListParams = {}) =>
    apiClient.get<TransactionListResult>("/transactions", {
      params: {
        dateFrom: params.dateFrom,
        dateTo: params.dateTo,
        type: params.type,
        categoryId: params.categoryId,
        payee: params.payee,
        q: params.q,
        limit: params.limit,
        offset: params.offset,
      },
    }),

  summary: (params: { month?: string; dateFrom?: string; dateTo?: string }) =>
    apiClient.get<MonthlyTotalsSummary>("/transactions/summary", {
      params,
    }),

  get: (id: string) => apiClient.get<Transaction>(`/transactions/${id}`),

  create: (input: CreateTransactionInput) =>
    apiClient.post<Transaction>("/transactions", input),
};
