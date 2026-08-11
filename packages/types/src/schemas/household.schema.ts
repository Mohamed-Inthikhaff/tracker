import { z } from "zod";

export const householdRoleSchema = z.enum(["Owner", "Member"]);
export type HouseholdRole = z.infer<typeof householdRoleSchema>;

export const createHouseholdSchema = z.object({
  name: z.string().min(1).max(120),
  baseCurrency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/, "baseCurrency must be ISO-4217 uppercase")
    .default("USD"),
});
export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;

export const updateHouseholdSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  baseCurrency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/)
    .optional(),
});
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().email().max(320),
  role: householdRoleSchema.default("Member"),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(16).max(128),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const bootstrapHouseholdSchema = z.object({
  email: z.string().email().max(320),
  displayName: z.string().min(1).max(120).optional(),
  householdName: z.string().min(1).max(120).optional(),
  baseCurrency: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/)
    .default("USD"),
});
export type BootstrapHouseholdInput = z.infer<typeof bootstrapHouseholdSchema>;

export const removeMemberSchema = z.object({
  userId: z.string().uuid(),
});
export type RemoveMemberInput = z.infer<typeof removeMemberSchema>;
