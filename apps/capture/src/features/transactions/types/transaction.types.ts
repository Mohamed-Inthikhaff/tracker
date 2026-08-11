import type {
  createTransactionSchema,
  TransactionType,
} from "@expense-tracker/types";
import type { z } from "zod";

export type { TransactionType };

export interface Transaction {
  id: string;
  householdId: string;
  categoryId: string;
  date: string;
  type: TransactionType;
  amount: string;
  description: string | null;
  payee: string | null;
  source: string;
  createdAt: string;
}

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  isActive: boolean;
  sortOrder: number;
}
