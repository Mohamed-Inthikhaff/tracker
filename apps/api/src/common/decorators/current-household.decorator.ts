import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest } from "../interfaces/authenticated-request.interface";

/**
 * Resolves the active household id attached by HouseholdScopeGuard.
 * Controllers: `@CurrentHousehold() householdId: string`
 */
export const CurrentHousehold = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const householdId = request.householdId;
    if (!householdId) {
      throw new Error(
        "CurrentHousehold() used without HouseholdScopeGuard — householdId missing on request"
      );
    }
    return householdId;
  }
);
