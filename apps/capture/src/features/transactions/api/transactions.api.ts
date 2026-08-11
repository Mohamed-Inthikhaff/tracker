import { apiClient } from "@/lib/api-client";
import type {
  Category,
  CreateTransactionInput,
  Transaction,
  TransactionType,
} from "../types/transaction.types";

export const transactionsApi = {
  create: (input: CreateTransactionInput) =>
    apiClient.post<Transaction>("/transactions", {
      ...input,
      date:
        input.date instanceof Date
          ? input.date.toISOString()
          : input.date,
    }),
};

export const categoriesApi = {
  list: (type?: TransactionType) => {
    const q = type ? `?type=${encodeURIComponent(type)}` : "";
    return apiClient.get<Category[]>(`/categories${q}`);
  },
};
