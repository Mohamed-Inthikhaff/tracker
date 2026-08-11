import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import type { InviteMemberInput } from "@expense-tracker/types";
import type { HouseholdsRepository } from "./households.repository";
import type {
  HouseholdSummary,
  InviteSummary,
} from "./interfaces/household.interface";
import {
  requireHousehold,
  requireOwner,
  requireUserByAuth0Sub,
  toHouseholdSummary,
} from "./household-access";

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** FR-AUTH-003 / FR-AUTH-004 — email invite create + accept flows. */
export async function inviteMember(
  repo: HouseholdsRepository,
  householdId: string,
  auth0Sub: string,
  input: InviteMemberInput
): Promise<InviteSummary> {
  const actor = await requireUserByAuth0Sub(repo, auth0Sub);
  await requireOwner(repo, householdId, actor.id);
  await requireHousehold(repo, householdId);

  const email = input.email.toLowerCase();
  const existingUser = await repo.findUserByEmail(email);
  if (existingUser) {
    const already = await repo.findActiveMembership(
      householdId,
      existingUser.id
    );
    if (already) {
      throw new ConflictException("User is already a household member");
    }
  }

  const pending = await repo.findPendingInviteByEmail(householdId, email);
  if (pending) {
    throw new ConflictException(
      "A pending invite already exists for this email"
    );
  }

  const invite = await repo.createInvite({
    householdId,
    email,
    role: input.role === "Owner" ? "Owner" : "Member",
    invitedByUserId: actor.id,
    expiresAt: new Date(Date.now() + INVITE_TTL_MS),
  });

  return {
    id: invite.id,
    email: invite.email,
    role: invite.role,
    token: invite.token,
    status: invite.status,
    expiresAt: invite.expiresAt,
  };
}

export async function acceptInvite(
  repo: HouseholdsRepository,
  auth0Sub: string,
  email: string | undefined,
  token: string
): Promise<HouseholdSummary> {
  const invite = await repo.findInviteByToken(token);
  if (!invite || invite.status !== "pending") {
    throw new NotFoundException("Invite not found or no longer valid");
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    invite.status = "expired";
    await repo.saveInvite(invite);
    throw new BadRequestException("Invite has expired");
  }

  const resolvedEmail = (email ?? "").toLowerCase();
  if (!resolvedEmail || resolvedEmail !== invite.email.toLowerCase()) {
    throw new ForbiddenException(
      "Authenticated email does not match the invitation"
    );
  }

  await requireHousehold(repo, invite.householdId);

  let user = await repo.findUserByAuth0Sub(auth0Sub);
  if (!user) {
    user = await repo.createUser({
      auth0Sub,
      email: resolvedEmail,
      displayName: resolvedEmail.split("@")[0],
    });
  }

  const existing = await repo.findActiveMembership(invite.householdId, user.id);
  if (!existing) {
    await repo.createMembership({
      householdId: invite.householdId,
      userId: user.id,
      role: invite.role,
    });
  }

  invite.status = "accepted";
  invite.acceptedAt = new Date();
  invite.acceptedByUserId = user.id;
  await repo.saveInvite(invite);

  const household = await requireHousehold(repo, invite.householdId);
  return toHouseholdSummary(household, invite.role);
}
