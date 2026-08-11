import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Repository } from "typeorm";
import { randomBytes } from "node:crypto";
import type { HouseholdRole } from "@expense-tracker/types";
import { Household } from "./entities/household.entity";
import { HouseholdMember } from "./entities/household-member.entity";
import { HouseholdInvite } from "./entities/household-invite.entity";
import { User } from "./entities/user.entity";

/**
 * Only file that imports TypeORM repositories for households.
 * Services depend on this class so specs can mock without a database.
 */
@Injectable()
export class HouseholdsRepository {
  constructor(
    @InjectRepository(Household)
    private readonly households: Repository<Household>,
    @InjectRepository(HouseholdMember)
    private readonly members: Repository<HouseholdMember>,
    @InjectRepository(HouseholdInvite)
    private readonly invites: Repository<HouseholdInvite>,
    @InjectRepository(User)
    private readonly users: Repository<User>
  ) {}

  findUserByAuth0Sub(auth0Sub: string): Promise<User | null> {
    return this.users.findOne({ where: { auth0Sub } });
  }

  findUserByEmail(email: string): Promise<User | null> {
    return this.users.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  findUserById(userId: string): Promise<User | null> {
    return this.users.findOne({ where: { id: userId } });
  }

  createUser(data: {
    auth0Sub: string;
    email: string;
    displayName: string;
  }): Promise<User> {
    const user = this.users.create({
      auth0Sub: data.auth0Sub,
      email: data.email.toLowerCase(),
      displayName: data.displayName,
    });
    return this.users.save(user);
  }

  findHouseholdById(id: string): Promise<Household | null> {
    return this.households.findOne({
      where: { id, deletedAt: IsNull() },
    });
  }

  createHousehold(data: {
    name: string;
    baseCurrency: string;
  }): Promise<Household> {
    return this.households.save(this.households.create(data));
  }

  saveHousehold(household: Household): Promise<Household> {
    return this.households.save(household);
  }

  softDeleteHousehold(id: string): Promise<void> {
    return this.households
      .update({ id }, { deletedAt: new Date() })
      .then(() => undefined);
  }

  findActiveMembership(
    householdId: string,
    userId: string
  ): Promise<HouseholdMember | null> {
    return this.members.findOne({
      where: { householdId, userId, removedAt: IsNull() },
    });
  }

  findActiveMembershipsForUser(userId: string): Promise<HouseholdMember[]> {
    return this.members.find({
      where: { userId, removedAt: IsNull() },
      relations: { household: true },
      order: { createdAt: "ASC" },
    });
  }

  findActiveMembers(householdId: string): Promise<HouseholdMember[]> {
    return this.members.find({
      where: { householdId, removedAt: IsNull() },
      relations: { user: true },
      order: { createdAt: "ASC" },
    });
  }

  createMembership(data: {
    householdId: string;
    userId: string;
    role: HouseholdRole;
  }): Promise<HouseholdMember> {
    return this.members.save(this.members.create(data));
  }

  async removeMembership(
    householdId: string,
    userId: string
  ): Promise<boolean> {
    const membership = await this.findActiveMembership(householdId, userId);
    if (!membership) {
      return false;
    }
    membership.removedAt = new Date();
    await this.members.save(membership);
    return true;
  }

  findPendingInviteByEmail(
    householdId: string,
    email: string
  ): Promise<HouseholdInvite | null> {
    return this.invites.findOne({
      where: {
        householdId,
        email: email.toLowerCase(),
        status: "pending",
      },
    });
  }

  findInviteByToken(token: string): Promise<HouseholdInvite | null> {
    return this.invites.findOne({ where: { token } });
  }

  createInvite(data: {
    householdId: string;
    email: string;
    role: HouseholdRole;
    invitedByUserId: string;
    expiresAt: Date;
  }): Promise<HouseholdInvite> {
    return this.invites.save(
      this.invites.create({
        householdId: data.householdId,
        email: data.email.toLowerCase(),
        role: data.role,
        invitedByUserId: data.invitedByUserId,
        expiresAt: data.expiresAt,
        token: randomBytes(24).toString("hex"),
        status: "pending",
      })
    );
  }

  saveInvite(invite: HouseholdInvite): Promise<HouseholdInvite> {
    return this.invites.save(invite);
  }
}
