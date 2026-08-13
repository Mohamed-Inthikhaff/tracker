import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type {
  AuthenticatedRequest,
  JwtUserClaims,
} from "../interfaces/authenticated-request.interface";
import {
  type AccessTokenPayload,
  verifyAccessToken,
} from "./verify-access-token";

/**
 * Verifies Bearer JWT and attaches `request.user`.
 * Auth0 RS256 via JWKS; HS256 `JWT_SECRET` only when `ALLOW_DEV_JWT=true`.
 *
 * JWT `householdIds` / `activeHouseholdId` are frontend convenience hints.
 * Access control is HouseholdScopeGuard + `household_members` (FR-AUTH-007).
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const value = Array.isArray(header) ? header[0] : header;
    if (!value?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid Authorization header");
    }

    const token = value.slice("Bearer ".length).trim();
    if (!token) {
      throw new UnauthorizedException("Missing bearer token");
    }

    try {
      const payload = await verifyAccessToken(token);
      request.user = toClaims(payload);
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

function toClaims(payload: AccessTokenPayload): JwtUserClaims {
  if (!payload.sub) {
    throw new UnauthorizedException("Token missing required claims");
  }
  const householdIds = Array.isArray(payload.householdIds)
    ? payload.householdIds
    : [];
  const activeHouseholdId = payload.activeHouseholdId?.trim() || undefined;

  return {
    userId: payload.sub,
    email: payload.email,
    activeHouseholdId,
    householdIds,
  };
}
