import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SKIP_HOUSEHOLD_SCOPE_KEY } from "../decorators/skip-household-scope.decorator";
import type { JwtUserClaims } from "../interfaces/authenticated-request.interface";
import type { HouseholdsRepository } from "../../modules/households/households.repository";
import type { User } from "../../modules/households/entities/user.entity";
import type { HouseholdMember } from "../../modules/households/entities/household-member.entity";
import { HouseholdScopeGuard } from "./household-scope.guard";

describe("HouseholdScopeGuard", () => {
  const householdId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const memberUser: User = {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    auth0Sub: "auth0|member",
    email: "member@example.com",
    displayName: "Member",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const ownerUser: User = {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    auth0Sub: "auth0|owner",
    email: "owner@example.com",
    displayName: "Owner",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const membership: HouseholdMember = {
    id: "mem-1",
    householdId,
    userId: memberUser.id,
    role: "Member",
    createdAt: new Date(),
    updatedAt: new Date(),
    removedAt: null,
  };

  let reflector: jest.Mocked<Pick<Reflector, "getAllAndOverride">>;
  let repo: jest.Mocked<
    Pick<HouseholdsRepository, "findUserByAuth0Sub" | "findActiveMembership">
  >;
  let guard: HouseholdScopeGuard;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(false),
    };
    repo = {
      findUserByAuth0Sub: jest.fn(),
      findActiveMembership: jest.fn(),
    };
    guard = new HouseholdScopeGuard(
      reflector as unknown as Reflector,
      repo as unknown as HouseholdsRepository
    );
  });

  function context(opts: {
    public?: boolean;
    skip?: boolean;
    user?: JwtUserClaims;
    householdHeader?: string;
  }): { ctx: ExecutionContext; request: { householdId?: string } } {
    reflector.getAllAndOverride.mockImplementation((key: unknown) => {
      if (key === IS_PUBLIC_KEY) return Boolean(opts.public);
      if (key === SKIP_HOUSEHOLD_SCOPE_KEY) return Boolean(opts.skip);
      return false;
    });
    const request: {
      user?: JwtUserClaims;
      householdId?: string;
      headers: Record<string, string | undefined>;
    } = {
      user: opts.user,
      headers: opts.householdHeader
        ? { "x-household-id": opts.householdHeader }
        : {},
    };
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    return { ctx, request };
  }

  it("skips public and @SkipHouseholdScope routes", async () => {
    const pub = context({ public: true });
    await expect(guard.canActivate(pub.ctx)).resolves.toBe(true);

    const skip = context({ skip: true });
    await expect(guard.canActivate(skip.ctx)).resolves.toBe(true);
    expect(repo.findActiveMembership).not.toHaveBeenCalled();
  });

  it("rejects unauthenticated requests", async () => {
    const { ctx } = context({});
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      UnauthorizedException
    );
  });

  it("lets a freshly bootstrapped Owner through without householdIds on the JWT", async () => {
    repo.findUserByAuth0Sub.mockResolvedValue(ownerUser);
    repo.findActiveMembership.mockResolvedValue({
      ...membership,
      userId: ownerUser.id,
      role: "Owner",
    });

    const { ctx, request } = context({
      householdHeader: householdId,
      user: {
        userId: ownerUser.auth0Sub,
        email: ownerUser.email,
        householdIds: [],
      },
    });

    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(request.householdId).toBe(householdId);
    expect(repo.findUserByAuth0Sub).toHaveBeenCalledWith(ownerUser.auth0Sub);
    expect(repo.findActiveMembership).toHaveBeenCalledWith(
      householdId,
      ownerUser.id
    );
  });

  it("revokes access immediately after FR-AUTH-006 removal even if JWT still lists the household", async () => {
    repo.findUserByAuth0Sub.mockResolvedValue(memberUser);
    repo.findActiveMembership.mockResolvedValue(null);

    const { ctx, request } = context({
      householdHeader: householdId,
      user: {
        userId: memberUser.auth0Sub,
        email: memberUser.email,
        activeHouseholdId: householdId,
        householdIds: [householdId],
      },
    });

    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(request.householdId).toBeUndefined();
    expect(repo.findActiveMembership).toHaveBeenCalledWith(
      householdId,
      memberUser.id
    );
  });
});
