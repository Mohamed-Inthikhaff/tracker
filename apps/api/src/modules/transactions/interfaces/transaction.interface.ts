import type {
  TransactionSource,
  TransactionType,
} from "@expense-tracker/types";

export interface TransactionView {
  id: string;
  householdId: string;
  categoryId: string;
  createdByUserId: string;
  date: string;
  type: TransactionType;
  /** Decimal string, e.g. "12.50" (never a JS number). */
  amount: string;
  currency: string;
  description: string | null;
  payee: string | null;
  notes: string | null;
  source: TransactionSource;
  aiConfidence: string | null;
  userConfirmedCategory: boolean;
  createdAt: Date;
}

export interface TransactionListResult {
  items: TransactionView[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateTransactionData {
  householdId: string;
  categoryId: string;
  createdByUserId: string;
  txnDate: string;
  type: TransactionType;
  amount: string;
  currency: string;
  description: string | null;
  payee: string | null;
  notes: string | null;
  source: TransactionSource;
  aiConfidence: string | null;
  userConfirmedCategory: boolean;
}

export interface TransactionSearchFilters {
  householdId: string;
  dateFrom?: Date;
  dateTo?: Date;
  type?: TransactionType;
  categoryId?: string;
  payee?: string;
  q?: string;
  limit: number;
  offset: number;
}
