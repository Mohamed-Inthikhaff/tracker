import { createZodDto } from "nestjs-zod";
import { updateTransactionSchema } from "@expense-tracker/types";

/** FR-TXN-003 — partial update DTO (shared Zod rules from packages/types). */
export class UpdateTransactionDto extends createZodDto(
  updateTransactionSchema
) {}
