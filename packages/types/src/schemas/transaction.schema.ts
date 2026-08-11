import { z } from "zod";
import { categoryTypeSchema } from "./category.schema";

/** Same five types as category/transaction vocabulary in the SRS. */
export const transactionTypeSchema = categoryTypeSchema;
export type TransactionType = z.infer<typeof transactionTypeSchema>;

export const transactionSourceSchema = z.enum([
  "manual",
  "receipt_ocr",
  "sms_parsed",
  "csv_import",
  "bank_sync",
]);
export type TransactionSource = z.infer<typeof transactionSourceSchema>;

/**
 * Monetary amount as fixed decimal string (FR-TXN-006).
 * Never use binary floating point for storage or API contract.
 */
export const moneyAmountSchema = z
  .string()
  .regex(
    /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/,
    "amount must be a positive decimal with at most 2 places"
  )
  .refine((v) => Number(v) > 0, "amount must be greater than zero");

/**
 * Phase 1: categoryId optional — when omitted and description is present,
 * classification.service suggests a category (FR-CAT-003).
 */
export const createTransactionSchema = z.object({
  date: z.coerce.date(),
  type: transactionTypeSchema,
  categoryId: z.string().uuid().nullable().optional(),
  amount: moneyAmountSchema,
  description: z.string().max(280).optional(),
  payee: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
  source: transactionSourceSchema.default("manual"),
});
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;

export const queryTransactionsSchema = z.object({
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  type: transactionTypeSchema.optional(),
  categoryId: z.string().uuid().optional(),
  payee: z.string().max(120).optional(),
  /** Free-text search over description + payee (FR-TXN-005). */
  q: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(500).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type QueryTransactionsInput = z.infer<typeof queryTransactionsSchema>;

/** Month as YYYY-MM for Dashboard-style KPI aggregation (Phase 0 exit check). */
export const monthlySummaryQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM")
    .optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});
export type MonthlySummaryQuery = z.infer<typeof monthlySummaryQuerySchema>;
