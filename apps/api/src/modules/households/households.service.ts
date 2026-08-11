import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  BootstrapHouseholdInput,
  CreateHouseholdInput,
  InviteMemberInput,
  UpdateHouseholdInput,
} from "@expense-tracker/types";
import { HouseholdsRepository } from "./households.repository";
import type {
  BootstrapResult,
  HouseholdSummary,
  InviteSummary,
  MemberSummary,
} from "./interfaces/household.interface";
import { Household } from "./entities/household.entity";
import {
  requireActiveMember,
  requireHousehold,
  requireOwner,
  requireUserByAuth0Sub,
  toHouseholdSummary,
} from "./household-access";
import {
  acceptInvite as acceptHouseholdInvite,
  inviteMember as createHouseholdInvite,
} from "./household-invites";

@Injectable()
export class HouseholdsService {
  constructor(private readonly repo: HouseholdsRepository) {}

  /**
   * FR-AUTH-002 — exactly one default Household on first successful registration.
   * Idempotent; `auth0Sub` is the JWT `sub` claim.
   */
  async createDefaultOnRegistration(
    auth0Sub: string,
    input: BootstrapHouseholdInput
  ): Promise<BootstrapResult> {
    const existingUser = await this.repo.findUserByAuth0Sub(auth0Sub);
    if (existingUser) {
      const memberships =
        await this.repo.findActiveMembershipsForUser(existingUser.id);
      const first = memberships[0];
      if (first?.household && !first.household.deletedAt) {
        return {
          userId: existingUser.id,
          household: toHouseholdSummary(first.household, first.role),
          created: false,
        };
      }
    }

    const email = input.email.toLowerCase();
    const user =
      existingUser ??
      (await this.repo.createUser({
        auth0Sub,
        email,
        displayName: input.displayName?.trim() || email.split("@")[0],
      }));

    const household = await this.repo.createHousehold({
      name: input.householdName?.trim() || "My Household",
      baseCurrency: input.baseCurrency ?? "USD",
    });

    await this.repo.createMembership({
      householdId: household.id,
      userId: user.id,
      role: "Owner",
    });

    return {
      userId: user.id,
      household: toHouseholdSummary(household, "Owner"),
      created: true,
    };
  }

  /** FR-AUTH-005 — user may belong to more than one household. */
  async createHousehold(
    auth0Sub: string,
    input: CreateHouseholdInput
  ): Promise<HouseholdSummary> {
    const user = await requireUserByAuth0Sub(this.repo, auth0Sub);
    const household = await this.repo.createHousehold({
      name: input.name,
      baseCurrency: input.baseCurrency,
    });
    await this.repo.createMembership({
      householdId: household.id,
      userId: user.id,
      role: "Owner",
    });
    return toHouseholdSummary(household, "Owner");
  }

  async listMyHouseholds(auth0Sub: string): Promise<HouseholdSummary[]> {
    const user = await requireUserByAuth0Sub(this.repo, auth0Sub);
    const memberships = await this.repo.findActiveMembershipsForUser(user.id);
    return memberships
      .filter((m) => m.household && !m.household.deletedAt)
      .map((m) => toHouseholdSummary(m.household as Household, m.role));
  }

  async getHousehold(
    householdId: string,
    auth0Sub: string
  ): Promise<HouseholdSummary> {
    const user = await requireUserByAuth0Sub(this.repo, auth0Sub);
    const membership = await requireActiveMember(
      this.repo,
      householdId,
      user.id
    );
    const household = await requireHousehold(this.repo, householdId);
    return toHouseholdSummary(household, membership.role);
  }

  async updateHousehold(
    householdId: string,
    auth0Sub: string,
    input: UpdateHouseholdInput
  ): Promise<HouseholdSummary> {
    const user = await requireUserByAuth0Sub(this.repo, auth0Sub);
    await requireOwner(this.repo, householdId, user.id);
    const household = await requireHousehold(this.repo, householdId);
    if (input.name !== undefined) household.name = input.name;
    if (input.baseCurrency !== undefined) {
      household.baseCurrency = input.baseCurrency;
    }
    const saved = await this.repo.saveHousehold(household);
    return toHouseholdSummary(saved, "Owner");
  }

  async removeHousehold(householdId: string, auth0Sub: string): Promise<void> {
    const user = await requireUserByAuth0Sub(this.repo, auth0Sub);
    await requireOwner(this.repo, householdId, user.id);
    await requireHousehold(this.repo, householdId);
    await this.repo.softDeleteHousehold(householdId);
  }

  async listMembers(
    householdId: string,
    auth0Sub: string
  ): Promise<MemberSummary[]> {
    const user = await requireUserByAuth0Sub(this.repo, auth0Sub);
    await requireActiveMember(this.repo, householdId, user.id);
    const members = await this.repo.findActiveMembers(householdId);
    return members
      .filter((m) => m.user)
      .map((m) => ({
        userId: m.userId,
        email: m.user!.email,
        displayName: m.user!.displayName,
        role: m.role,
        joinedAt: m.createdAt,
      }));
  }

  inviteMember(
    householdId: string,
    auth0Sub: string,
    input: InviteMemberInput
  ): Promise<InviteSummary> {
    return createHouseholdInvite(this.repo, householdId, auth0Sub, input);
  }

  acceptInvite(
    auth0Sub: string,
    email: string | undefined,
    token: string
  ): Promise<HouseholdSummary> {
    return acceptHouseholdInvite(this.repo, auth0Sub, email, token);
  }

  /**
   * FR-AUTH-006 — owner removes a member; access revoked immediately.
   * `targetUserId` is internal users.id (from listMembers).
   */
  async removeMember(
    householdId: string,
    auth0Sub: string,
    targetUserId: string
  ): Promise<void> {
    const actor = await requireUserByAuth0Sub(this.repo, auth0Sub);
    await requireOwner(this.repo, householdId, actor.id);
    if (actor.id === targetUserId) {
      throw new BadRequestException(
        "Owner cannot remove themselves; transfer ownership or delete the household"
      );
    }

    const target = await this.repo.findActiveMembership(
      householdId,
      targetUserId
    );
    if (!target) {
      throw new NotFoundException("Member not found in this household");
    }
    if (target.role === "Owner") {
      throw new ForbiddenException("Cannot remove another Owner");
    }

    const removed = await this.repo.removeMembership(householdId, targetUserId);
    if (!removed) {
      throw new NotFoundException("Member not found in this household");
    }
  }

  /** Active membership check (ids are internal UUIDs). */
  async hasAccess(householdId: string, userId: string): Promise<boolean> {
    const membership = await this.repo.findActiveMembership(
      householdId,
      userId
    );
    if (!membership) return false;
    const household = await this.repo.findHouseholdById(householdId);
    return Boolean(household);
  }
}
