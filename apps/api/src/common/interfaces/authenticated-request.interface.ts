/**
 * Express request shape after AuthGuard + HouseholdScopeGuard run.
 * Feature modules must not reach outside request.user / request.householdId
 * for tenant scoping — use @CurrentHousehold() / @CurrentUser() instead.
 */
export interface JwtUserClaims {
  /** Authenticated user id (JWT `sub`). */
  userId: string;
  email?: string;
  /**
   * JWT hint: last-known / default active household (frontend convenience).
   * Not used as the access-control source of truth (FR-AUTH-007).
   */
  activeHouseholdId?: string;
  /**
   * JWT hint: households the client thinks the user belongs to.
   * Membership is verified per-request against `household_members`.
   */
  householdIds: string[];
}

export interface AuthenticatedRequest {
  user?: JwtUserClaims;
  /** Resolved tenant for this request (after HouseholdScopeGuard). */
  householdId?: string;
  headers: Record<string, string | string[] | undefined>;
}
