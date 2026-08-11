import { z } from "zod";
import { moneyAmountSchema } from "./transaction.schema";

/**
 * Direction on the debt ledger (FR-DEBT-001).
 * IOwe = household borrowed (owes money out).
 * OwedToMe = household lent (claim on money in).
 */
export const debtDirectionSchema = z.enum(["IOwe", "OwedToMe"]);
export type DebtDirection = z.infer<typeof debtDirectionSchema>;

/** FR-DEBT-005 — derived from remaining, not stored as source of truth. */
export const debtStatusSchema = z.enum([
  "Outstanding",
  "PartiallyPaid",
  "Settled",
]);
export type DebtStatus = z.infer<typeof debtStatusSchema>;

export const createDebtSchema = z.object({
  personName: z.string().min(1).max(120),
  direction: debtDirectionSchema,
  principalAmount: moneyAmountSchema,
  openedDate: z.coerce.date(),
  notes: z.string().max(1000).optional(),
});
export type CreateDebtInput = z.infer<typeof createDebtSchema>;

export const updateDebtSchema = z.object({
  personName: z.string().min(1).max(120).optional(),
  notes: z.string().max(1000).nullable().optional(),
  /** Principal only — date/direction changes would break window history. */
  principalAmount: moneyAmountSchema.optional(),
});
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
