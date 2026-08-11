import { createZodDto } from "nestjs-zod";
import {
  commitImportSchema,
  previewImportSchema,
} from "@expense-tracker/types";

export class PreviewImportDto extends createZodDto(previewImportSchema) {}
export class CommitImportDto extends createZodDto(commitImportSchema) {}
