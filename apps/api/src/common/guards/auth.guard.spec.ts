import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as jwt from "jsonwebtoken";

jest.mock("jwks-rsa", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    getSigningKey: jest.fn(),
  })),
}));

import { AuthGuard } from "./auth.guard";

describe("AuthGuard", () => {
  const secret = "test-jwt-secret";
  let guard: AuthGuard;
  let reflector: jest.Mocked<Pick<Reflector, "getAllAndOverride">>;

  beforeEach(() => {
    process.env.JWT_SECRET = secret;
    process.env.ALLOW_DEV_JWT = "true";
    delete process.env.AUTH0_DOMAIN;
    delete process.env.AUTH0_AUDIENCE;
    reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    guard = new AuthGuard(reflector as unknown as Reflector);
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.ALLOW_DEV_JWT;
    delete process.env.AUTH0_DOMAIN;
    delete process.env.AUTH0_AUDIENCE;
  });

  function ctxFor(request: { headers: Record<string, string> }) {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => request }),
    };
  }

  it("accepts a token without householdIds (bootstrap hint-only claims)", async () => {
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

    await expect(guard.canActivate(ctxFor(request) as never)).resolves.toBe(
      true
    );
    expect(request.user?.householdIds).toEqual([]);
  });

  it("does not reject activeHouseholdId when householdIds is empty", async () => {
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

    await expect(guard.canActivate(ctxFor(request) as never)).resolves.toBe(
      true
    );
  });

  it("rejects a missing bearer token", async () => {
    await expect(
      guard.canActivate(ctxFor({ headers: {} }) as never)
    ).rejects.toThrow(UnauthorizedException);
  });

  it("accepts HS256 JWT_SECRET tokens when ALLOW_DEV_JWT is true", async () => {
    process.env.AUTH0_DOMAIN = "example.auth0.com";
    process.env.AUTH0_AUDIENCE = "https://expense-tracker-api";
    const token = jwt.sign({ sub: "auth0|owner", householdIds: [] }, secret);
    const request = {
      headers: { authorization: `Bearer ${token}` },
    };

    await expect(guard.canActivate(ctxFor(request) as never)).resolves.toBe(
      true
    );
  });

  it("rejects HS256 tokens when ALLOW_DEV_JWT is not true", async () => {
    delete process.env.ALLOW_DEV_JWT;
    process.env.AUTH0_DOMAIN = "example.auth0.com";
    process.env.AUTH0_AUDIENCE = "https://expense-tracker-api";
    const token = jwt.sign({ sub: "auth0|owner", householdIds: [] }, secret);
    const request = {
      headers: { authorization: `Bearer ${token}` },
    };

    await expect(
      guard.canActivate(ctxFor(request) as never)
    ).rejects.toThrow(UnauthorizedException);
  });

  it("rejects RS256 tokens when Auth0 JWKS is not configured", async () => {
    const header = Buffer.from(
      JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test" })
    ).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({ sub: "auth0|owner" })
    ).toString("base64url");
    const request = {
      headers: { authorization: `Bearer ${header}.${payload}.sig` },
    };

    await expect(
      guard.canActivate(ctxFor(request) as never)
    ).rejects.toThrow(UnauthorizedException);
  });
});
