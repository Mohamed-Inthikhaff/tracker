import { Injectable } from "@nestjs/common";
import { ZodValidationPipe as NestjsZodValidationPipe } from "nestjs-zod";

/**
 * Global validation pipe. Body/query/param DTOs should be nestjs-zod
 * `createZodDto(schema)` classes so the same Zod schema can be shared from
 * packages/types (implementation-plan.md Section 7).
 */
@Injectable()
export class ZodValidationPipe extends NestjsZodValidationPipe {}
