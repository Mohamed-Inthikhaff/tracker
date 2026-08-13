import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as jwt from "jsonwebtoken";
import { AuthGuard } from "./auth.guard";

describe("AuthGuard", () => {
  const secret = "test-jwt-secret";
  let guard: AuthGuard;
  let reflector: jest.Mocked<Pick<Reflector, "getAllAndOverride">>;

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new AuthGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
  });

  it("accepts a token without householdIds (bootstrap hint-only claims)", () => {
    const token = jwt.sign(
      { sub: "auth0|owner", email: "owner@example.com", householdIds: [] },
      secret
    );
    const request: {
      headers: Record<string, string>;
      user?: { householdIds: string[]; activeHouseholdId?: string };
    } = {
      headers: { authorization: `Bearer ${token}` },
    };
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    };

    expect(guard.canActivate(ctx as never)).toBe(true);
    expect(request.user?.householdIds).toEqual([]);
  });

  it("does not reject activeHouseholdId when householdIds is empty", () => {
    const token = jwt.sign(
      {
        sub: "auth0|owner",
        activeHouseholdId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        householdIds: [],
      },
      secret
    );
    const request = {
      headers: { authorization: `Bearer ${token}` },
    };
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    };

    expect(guard.canActivate(ctx as never)).toBe(true);
  });

  it("rejects a missing bearer token", () => {
    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    };
    expect(() => guard.canActivate(ctx as never)).toThrow(UnauthorizedException);
  });
});
