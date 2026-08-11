import { createZodDto } from "nestjs-zod";
import {
  createTransactionSchema,
  monthlySummaryQuerySchema,
  queryTransactionsSchema,
} from "@expense-tracker/types";

export class CreateTransactionDto extends createZodDto(
  createTransactionSchema
) {}

export class QueryTransactionsDto extends createZodDto(
  queryTransactionsSchema
) {}

export class MonthlySummaryQueryDto extends createZodDto(
  monthlySummaryQuerySchema
) {}
