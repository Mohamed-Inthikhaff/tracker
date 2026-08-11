import { createZodDto } from "nestjs-zod";
import {
  createCategorySchema,
  reorderCategoriesSchema,
  updateCategorySchema,
} from "@expense-tracker/types";

export class CreateCategoryDto extends createZodDto(createCategorySchema) {}
export class UpdateCategoryDto extends createZodDto(updateCategorySchema) {}
export class ReorderCategoriesDto extends createZodDto(
  reorderCategoriesSchema
) {}
