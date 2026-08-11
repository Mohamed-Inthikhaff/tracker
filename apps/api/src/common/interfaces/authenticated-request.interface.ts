/**
 * Express request shape after AuthGuard + HouseholdScopeGuard run.
 * Feature modules must not reach outside request.user / request.householdId
 * for tenant scoping — use @CurrentHousehold() / @CurrentUser() instead.
 */
export interface JwtUserClaims {
  /** Authenticated user id (JWT `sub`). */
  userId: string;
  email?: string;
  /** Claim from token: last-known / default active household. */
  activeHouseholdId: string;
  /** All households the user may access (membership set). */
  householdIds: string[];
}

export interface AuthenticatedRequest {
  user?: JwtUserClaims;
  /** Resolved tenant for this request (after HouseholdScopeGuard). */
  householdId?: string;
  headers: Record<string, string | string[] | undefined>;
}
