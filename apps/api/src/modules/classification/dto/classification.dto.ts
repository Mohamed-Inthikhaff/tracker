import { createZodDto } from "nestjs-zod";
import {
  recordClassificationFeedbackSchema,
  suggestCategorySchema,
} from "@expense-tracker/types";

export class SuggestCategoryDto extends createZodDto(suggestCategorySchema) {}
export class RecordClassificationFeedbackDto extends createZodDto(
  recordClassificationFeedbackSchema
) {}
