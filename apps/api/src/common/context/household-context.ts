import { AsyncLocalStorage } from "node:async_hooks";

export interface HouseholdContextStore {
  householdId: string;
  userId: string;
}

/** Request-scoped household context (set by HouseholdContextInterceptor). */
export const householdContext = new AsyncLocalStorage<HouseholdContextStore>();

export function getHouseholdContext(): HouseholdContextStore | undefined {
  return householdContext.getStore();
}
