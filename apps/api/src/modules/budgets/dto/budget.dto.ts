import { createZodDto } from "nestjs-zod";
import {
  copyBudgetMonthSchema,
  listBudgetsQuerySchema,
  setBudgetSchema,
} from "@expense-tracker/types";

export class SetBudgetDto extends createZodDto(setBudgetSchema) {}
export class CopyBudgetMonthDto extends createZodDto(copyBudgetMonthSchema) {}
export class ListBudgetsQueryDto extends createZodDto(listBudgetsQuerySchema) {}
