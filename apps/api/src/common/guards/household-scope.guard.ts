import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SKIP_HOUSEHOLD_SCOPE_KEY } from "../decorators/skip-household-scope.decorator";
import type { AuthenticatedRequest } from "../interfaces/authenticated-request.interface";
import { HouseholdsRepository } from "../../modules/households/households.repository";

/**
 * Resolves the request's active household (FR-AUTH-007).
 * Prefer `X-Household-Id` when switching; otherwise fall back to JWT
 * `activeHouseholdId` as a convenience hint only. Membership is always
 * verified against `household_members` (not JWT `householdIds`).
 */
@Injectable()
export class HouseholdScopeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly households: HouseholdsRepository
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const skipHousehold = this.reflector.getAllAndOverride<boolean>(
      SKIP_HOUSEHOLD_SCOPE_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (skipHousehold) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException("Authenticated user required");
    }

    const header = request.headers["x-household-id"];
    const requested =
      (Array.isArray(header) ? header[0] : header)?.trim() ||
      user.activeHouseholdId;

    if (!requested) {
      throw new ForbiddenException("No active household on request");
    }

    const dbUser = await this.households.findUserByAuth0Sub(user.userId);
    if (!dbUser) {
      throw new ForbiddenException(
        "User is not a member of the requested household"
      );
    }

    const membership = await this.households.findActiveMembership(
      requested,
      dbUser.id
    );
    if (!membership) {
      throw new ForbiddenException(
        "User is not a member of the requested household"
      );
    }

    request.householdId = requested;
    return true;
  }
}
