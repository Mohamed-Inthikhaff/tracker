import { z } from "zod";
import { moneyAmountSchema } from "./transaction.schema";

/** Month key YYYY-MM (FR-BUD-001). */
export const budgetMonthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "month must be YYYY-MM");

/** Traffic-light health for FR-BUD-004 (tokens: under / near / over). */
export const budgetHealthSchema = z.enum(["Under", "Near", "Over"]);
export type BudgetHealth = z.infer<typeof budgetHealthSchema>;

export const setBudgetSchema = z.object({
  categoryId: z.string().uuid(),
  month: budgetMonthSchema,
  budgetedAmount: moneyAmountSchema,
});
export type SetBudgetInput = z.infer<typeof setBudgetSchema>;

export const copyBudgetMonthSchema = z.object({
  fromMonth: budgetMonthSchema,
  toMonth: budgetMonthSchema,
});
export type CopyBudgetMonthInput = z.infer<typeof copyBudgetMonthSchema>;

export const listBudgetsQuerySchema = z.object({
  month: budgetMonthSchema,
});
export type ListBudgetsQuery = z.infer<typeof listBudgetsQuerySchema>;
