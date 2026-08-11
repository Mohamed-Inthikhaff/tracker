import {
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import type { HouseholdRole } from "@expense-tracker/types";
import type { HouseholdsRepository } from "./households.repository";
import type { HouseholdSummary } from "./interfaces/household.interface";
import { Household } from "./entities/household.entity";
import { User } from "./entities/user.entity";
import type { HouseholdMember } from "./entities/household-member.entity";

export function toHouseholdSummary(
  household: Household,
  role: HouseholdRole
): HouseholdSummary {
  return {
    id: household.id,
    name: household.name,
    baseCurrency: household.baseCurrency,
    role,
    createdAt: household.createdAt,
  };
}

export async function requireUserByAuth0Sub(
  repo: HouseholdsRepository,
  auth0Sub: string
): Promise<User> {
  const user = await repo.findUserByAuth0Sub(auth0Sub);
  if (!user) {
    throw new NotFoundException(
      "User not found — complete registration bootstrap first"
    );
  }
  return user;
}

export async function requireHousehold(
  repo: HouseholdsRepository,
  householdId: string
): Promise<Household> {
  const household = await repo.findHouseholdById(householdId);
  if (!household) {
    throw new NotFoundException("Household not found");
  }
  return household;
}

export async function requireActiveMember(
  repo: HouseholdsRepository,
  householdId: string,
  userId: string
): Promise<HouseholdMember> {
  const membership = await repo.findActiveMembership(householdId, userId);
  if (!membership) {
    throw new ForbiddenException("Not a member of this household");
  }
  return membership;
}

export async function requireOwner(
  repo: HouseholdsRepository,
  householdId: string,
  userId: string
): Promise<HouseholdMember> {
  const membership = await requireActiveMember(repo, householdId, userId);
  if (membership.role !== "Owner") {
    throw new ForbiddenException("Owner role required");
  }
  return membership;
}
