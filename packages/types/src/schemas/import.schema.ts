import { z } from "zod";
import { transactionTypeSchema } from "./transaction.schema";

/** Mappable CSV columns → transaction fields (FR-IMP-001). */
export const importFieldSchema = z.enum([
  "date",
  "type",
  "category",
  "amount",
  "description",
  "payee",
  "notes",
  "skip",
]);
export type ImportField = z.infer<typeof importFieldSchema>;

export const columnMappingSchema = z.record(z.string(), importFieldSchema);
export type ColumnMapping = z.infer<typeof columnMappingSchema>;

/**
 * Confirmed CSV date layout (FR-IMP-001). Never infer per-row —
 * preview/commit parse every date with this format only.
 */
export const importDateFormatSchema = z.enum(["iso", "dmy", "mdy"]);
export type ImportDateFormat = z.infer<typeof importDateFormatSchema>;

/** One-time remaps for unrecognized category labels (FR-IMP-002). */
export const categoryRemapSchema = z.object({
  sourceName: z.string().min(1).max(120),
  type: transactionTypeSchema,
  /** Map to an existing household category. */
  targetCategoryId: z.string().uuid().optional(),
  /** Or create a new category with this name (defaults to sourceName). */
  createCategory: z.boolean().optional(),
  newCategoryName: z.string().min(1).max(80).optional(),
});
export type CategoryRemap = z.infer<typeof categoryRemapSchema>;

export const previewImportSchema = z.object({
  mapping: columnMappingSchema,
  dateFormat: importDateFormatSchema,
  categoryRemaps: z.array(categoryRemapSchema).default([]),
});
export type PreviewImportInput = z.infer<typeof previewImportSchema>;

export const commitImportSchema = z.object({
  mapping: columnMappingSchema,
  dateFormat: importDateFormatSchema,
  categoryRemaps: z.array(categoryRemapSchema).default([]),
});
export type CommitImportInput = z.infer<typeof commitImportSchema>;
