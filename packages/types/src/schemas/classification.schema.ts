import { z } from "zod";

export const suggestCategorySchema = z.object({
  description: z.string().min(1).max(280),
  /** Optional type hint narrows the candidate category list. */
  type: z
    .enum(["Income", "Expense", "Saving", "DebtGiven", "DebtReceived"])
    .optional(),
});
export type SuggestCategoryInput = z.infer<typeof suggestCategorySchema>;

export const recordClassificationFeedbackSchema = z.object({
  description: z.string().min(1).max(280),
  categoryId: z.string().uuid(),
  /** true = user accepted AI suggestion; false = user overrode it. */
  accepted: z.boolean(),
  suggestedCategoryId: z.string().uuid().nullable().optional(),
});
export type RecordClassificationFeedbackInput = z.infer<
  typeof recordClassificationFeedbackSchema
>;
