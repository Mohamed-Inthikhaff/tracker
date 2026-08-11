import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import * as jwt from "jsonwebtoken";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type {
  AuthenticatedRequest,
  JwtUserClaims,
} from "../interfaces/authenticated-request.interface";

interface AccessTokenPayload {
  sub: string;
  email?: string;
  activeHouseholdId: string;
  householdIds: string[];
}

/**
 * Verifies Bearer JWT and attaches `request.user`.
 * Real identity provider (Auth0) wiring lands in the auth module;
 * this guard only enforces the token contract every route relies on.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
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

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException(
        "JWT_SECRET is not configured — cannot verify tokens"
      );
    }

    try {
      const payload = jwt.verify(token, secret) as AccessTokenPayload;
      request.user = toClaims(payload);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}

function toClaims(payload: AccessTokenPayload): JwtUserClaims {
  if (!payload.sub || !payload.activeHouseholdId) {
    throw new UnauthorizedException("Token missing required claims");
  }
  const householdIds = Array.isArray(payload.householdIds)
    ? payload.householdIds
    : [];
  if (
    householdIds.length === 0 ||
    !householdIds.includes(payload.activeHouseholdId)
  ) {
    throw new UnauthorizedException(
      "Token household claims are invalid or incomplete"
    );
  }
  return {
    userId: payload.sub,
    email: payload.email,
    activeHouseholdId: payload.activeHouseholdId,
    householdIds,
  };
}
