import { createZodDto } from "nestjs-zod";
import {
  acceptInviteSchema,
  bootstrapHouseholdSchema,
  createHouseholdSchema,
  inviteMemberSchema,
  removeMemberSchema,
  updateHouseholdSchema,
} from "@expense-tracker/types";

export class CreateHouseholdDto extends createZodDto(createHouseholdSchema) {}
export class UpdateHouseholdDto extends createZodDto(updateHouseholdSchema) {}
export class InviteMemberDto extends createZodDto(inviteMemberSchema) {}
export class AcceptInviteDto extends createZodDto(acceptInviteSchema) {}
export class BootstrapHouseholdDto extends createZodDto(
  bootstrapHouseholdSchema
) {}
export class RemoveMemberDto extends createZodDto(removeMemberSchema) {}
