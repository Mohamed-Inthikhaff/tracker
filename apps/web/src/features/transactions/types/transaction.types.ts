import type { createTransactionSchema } from "@expense-tracker/types";
import type { z } from "zod";

export type TransactionType =
  | "Income"
  | "Expense"
  | "Saving"
  | "DebtGiven"
  | "DebtReceived";

export interface Transaction {
  id: string;
  householdId: string;
  categoryId: string;
  createdByUserId: string;
  date: string;
  type: TransactionType;
  amount: string;
  currency: string;
  description: string | null;
  payee: string | null;
  notes: string | null;
  source: string;
  aiConfidence: string | null;
  userConfirmedCategory: boolean;
  createdAt: string;
}

export interface TransactionListResult {
  items: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export interface TransactionListParams {
  dateFrom?: string;
  dateTo?: string;
  type?: TransactionType;
  categoryId?: string;
  payee?: string;
  q?: string;
  limit?: number;
  offset?: number;
}

export interface MonthlyTotalsSummary {
  dateFrom: string;
  dateTo: string;
  month: string | null;
  count: number;
  byType: {
    Income: string;
    Expense: string;
    Saving: string;
    DebtGiven: string;
    DebtReceived: string;
  };
  netBalance: string;
}
