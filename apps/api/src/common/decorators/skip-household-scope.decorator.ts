import { SetMetadata } from "@nestjs/common";

/**
 * Authenticated routes that intentionally run outside household scope
 * (default-household bootstrap, invite accept, list my households).
 */
export const SKIP_HOUSEHOLD_SCOPE_KEY = "skipHouseholdScope";
export const SkipHouseholdScope = () =>
  SetMetadata(SKIP_HOUSEHOLD_SCOPE_KEY, true);
