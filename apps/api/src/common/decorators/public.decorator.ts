import { SetMetadata } from "@nestjs/common";

/** Skip AuthGuard + HouseholdScopeGuard (health checks, invite-accept later). */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
