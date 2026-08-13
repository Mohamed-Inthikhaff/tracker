import { apiClient } from "@/lib/api-client";
import type {
  CreateTransactionInput,
  MonthlyTotalsSummary,
  Transaction,
  TransactionListParams,
  TransactionListResult,
  UpdateTransactionInput,
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

  update: (id: string, input: UpdateTransactionInput) =>
    apiClient.patch<Transaction>(`/transactions/${id}`, {
      ...input,
      date:
        input.date instanceof Date
          ? input.date.toISOString()
          : input.date,
    }),

  delete: (id: string) => apiClient.delete<void>(`/transactions/${id}`),
};
