import { HouseholdsService } from "./households.service";
import type { HouseholdsRepository } from "./households.repository";
import type { Household } from "./entities/household.entity";
import type { HouseholdMember } from "./entities/household-member.entity";
import type { User } from "./entities/user.entity";
import type { CategoriesService } from "../categories/categories.service";

describe("HouseholdsService", () => {
  let service: HouseholdsService;
  let repo: jest.Mocked<HouseholdsRepository>;
  let categories: jest.Mocked<Pick<CategoriesService, "seedDefaultsForHousehold">>;

  const ownerUser: User = {
    id: "11111111-1111-1111-1111-111111111111",
    auth0Sub: "auth0|owner",
    email: "owner@example.com",
    displayName: "Owner",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const memberUser: User = {
    id: "22222222-2222-2222-2222-222222222222",
    auth0Sub: "auth0|member",
    email: "member@example.com",
    displayName: "Member",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const household: Household = {
    id: "33333333-3333-3333-3333-333333333333",
    name: "My Household",
    baseCurrency: "USD",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    deletedAt: null,
  };

  beforeEach(() => {
    repo = {
      findUserByAuth0Sub: jest.fn(),
      findUserByEmail: jest.fn(),
      findUserById: jest.fn(),
      createUser: jest.fn(),
      findHouseholdById: jest.fn(),
      createHousehold: jest.fn(),
      saveHousehold: jest.fn(),
      softDeleteHousehold: jest.fn(),
      findActiveMembership: jest.fn(),
      findActiveMembershipsForUser: jest.fn(),
      findActiveMembers: jest.fn(),
      createMembership: jest.fn(),
      removeMembership: jest.fn(),
      findPendingInviteByEmail: jest.fn(),
      findInviteByToken: jest.fn(),
      createInvite: jest.fn(),
      saveInvite: jest.fn(),
    } as unknown as jest.Mocked<HouseholdsRepository>;

    categories = {
      seedDefaultsForHousehold: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<
      Pick<CategoriesService, "seedDefaultsForHousehold">
    >;

    service = new HouseholdsService(
      repo,
      categories as unknown as CategoriesService
    );
  });

  describe("createDefaultOnRegistration (FR-AUTH-002)", () => {
    it("creates a default household and Owner membership on first registration", async () => {
      repo.findUserByAuth0Sub.mockResolvedValue(null);
      repo.createUser.mockResolvedValue(ownerUser);
      repo.createHousehold.mockResolvedValue(household);
      repo.createMembership.mockResolvedValue({
        id: "mem-1",
        householdId: household.id,
        userId: ownerUser.id,
        role: "Owner",
        createdAt: new Date(),
        updatedAt: new Date(),
        removedAt: null,
      } as HouseholdMember);

      const result = await service.createDefaultOnRegistration("auth0|owner", {
        email: "owner@example.com",
        displayName: "Owner",
        baseCurrency: "USD",
      });

      expect(result.created).toBe(true);
      expect(result.household.id).toBe(household.id);
      expect(result.household.role).toBe("Owner");
      expect(repo.createUser).toHaveBeenCalledWith({
        auth0Sub: "auth0|owner",
        email: "owner@example.com",
        displayName: "Owner",
      });
      expect(repo.createHousehold).toHaveBeenCalled();
      expect(repo.createMembership).toHaveBeenCalledWith({
        householdId: household.id,
        userId: ownerUser.id,
        role: "Owner",
      });
      expect(categories.seedDefaultsForHousehold).toHaveBeenCalledWith(
        household.id
      );
    });

    it("is idempotent when the user already has a default household", async () => {
      repo.findUserByAuth0Sub.mockResolvedValue(ownerUser);
      repo.findActiveMembershipsForUser.mockResolvedValue([
        {
          id: "mem-1",
          householdId: household.id,
          userId: ownerUser.id,
          role: "Owner",
          createdAt: new Date(),
          updatedAt: new Date(),
          removedAt: null,
          household,
        } as HouseholdMember,
      ]);

      const result = await service.createDefaultOnRegistration("auth0|owner", {
        email: "owner@example.com",
        baseCurrency: "USD",
      });

      expect(result.created).toBe(false);
      expect(repo.createHousehold).not.toHaveBeenCalled();
      expect(repo.createMembership).not.toHaveBeenCalled();
    });
  });

  describe("removeMember (FR-AUTH-006)", () => {
    it("revokes access so the removed member no longer has household access", async () => {
      repo.findUserByAuth0Sub.mockResolvedValue(ownerUser);
      repo.findActiveMembership
        // requireOwner(actor)
        .mockResolvedValueOnce({
          id: "mem-owner",
          householdId: household.id,
          userId: ownerUser.id,
          role: "Owner",
          createdAt: new Date(),
          updatedAt: new Date(),
          removedAt: null,
        } as HouseholdMember)
        // target membership lookup
        .mockResolvedValueOnce({
          id: "mem-member",
          householdId: household.id,
          userId: memberUser.id,
          role: "Member",
          createdAt: new Date(),
          updatedAt: new Date(),
          removedAt: null,
        } as HouseholdMember)
        // hasAccess after remove
        .mockResolvedValueOnce(null);

      repo.removeMembership.mockResolvedValue(true);
      repo.findHouseholdById.mockResolvedValue(household);

      await service.removeMember(
        household.id,
        ownerUser.auth0Sub,
        memberUser.id
      );

      expect(repo.removeMembership).toHaveBeenCalledWith(
        household.id,
        memberUser.id
      );

      const stillHasAccess = await service.hasAccess(
        household.id,
        memberUser.id
      );
      expect(stillHasAccess).toBe(false);
    });
  });
});
