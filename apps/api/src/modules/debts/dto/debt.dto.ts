import { createZodDto } from "nestjs-zod";
import { createDebtSchema, updateDebtSchema } from "@expense-tracker/types";

export class CreateDebtDto extends createZodDto(createDebtSchema) {}
export class UpdateDebtDto extends createZodDto(updateDebtSchema) {}
