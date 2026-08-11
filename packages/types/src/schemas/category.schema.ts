import { z } from "zod";

/** Matches transaction type vocabulary (implementation-plan / feasibility study). */
export const categoryTypeSchema = z.enum([
  "Income",
  "Expense",
  "Saving",
  "DebtGiven",
  "DebtReceived",
]);
export type CategoryType = z.infer<typeof categoryTypeSchema>;

export const createCategorySchema = z.object({
  name: z.string().min(1).max(80),
  type: categoryTypeSchema,
  parentCategoryId: z.string().uuid().nullable().optional(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(80).optional(),
  parentCategoryId: z.string().uuid().nullable().optional(),
});
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

export const reorderCategoriesSchema = z.object({
  orderedIds: z.array(z.string().uuid()).min(1),
});
export type ReorderCategoriesInput = z.infer<typeof reorderCategoriesSchema>;

export const listCategoriesQuerySchema = z.object({
  includeInactive: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  type: categoryTypeSchema.optional(),
});
export type ListCategoriesQuery = z.infer<typeof listCategoriesQuerySchema>;
