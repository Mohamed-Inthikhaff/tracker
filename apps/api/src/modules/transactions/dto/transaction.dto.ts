import { createZodDto } from "nestjs-zod";
import {
  createTransactionSchema,
  queryTransactionsSchema,
} from "@expense-tracker/types";

export class CreateTransactionDto extends createZodDto(
  createTransactionSchema
) {}

export class QueryTransactionsDto extends createZodDto(
  queryTransactionsSchema
) {}
