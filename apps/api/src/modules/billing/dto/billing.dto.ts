import { createZodDto } from "nestjs-zod";
import {
  createBillingPortalSchema,
  createCheckoutSessionSchema,
} from "@expense-tracker/types";

export class CreateCheckoutSessionDto extends createZodDto(
  createCheckoutSessionSchema
) {}
export class CreateBillingPortalDto extends createZodDto(
  createBillingPortalSchema
) {}
