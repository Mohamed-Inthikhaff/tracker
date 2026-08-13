"use client";

import { useEffect, useRef } from "react";
import { getAccessToken, useUser } from "@auth0/nextjs-auth0/client";
import { useAuthStore } from "@/stores/use-auth-store";
import { useHouseholdStore } from "@/stores/use-household-store";
import { useBootstrap } from "./useAuth";

/**
 * When an Auth0 session cookie exists, copy the API access token into the
 * existing Zustand store and bootstrap the default household (FR-AUTH-002).
 */
export function useAuth0Session() {
  const { user, isLoading } = useUser();
  const setSession = useAuthStore((s) => s.setSession);
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  const bootstrap = useBootstrap();
  const startedForSub = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !user?.sub) return;

    const existing = useAuthStore.getState();
    if (
      existing.accessToken &&
      existing.user?.sub === user.sub &&
      householdId
    ) {
      return;
    }

    if (startedForSub.current === user.sub) return;
    startedForSub.current = user.sub;

    const email = sanitizeEmail(
      typeof user.email === "string" ? user.email : "",
      user.sub
    );
    const displayName =
      (typeof user.name === "string" && user.name) ||
      (typeof user.nickname === "string" && user.nickname) ||
      email.split("@")[0] ||
      "User";

    void (async () => {
      try {
        const token = await getAccessToken();
        if (!token) {
          startedForSub.current = null;
          return;
        }
        setSession(token, {
          sub: user.sub as string,
          email,
          displayName,
        });
        await bootstrap.mutateAsync({
          email,
          displayName,
          householdName: "My Household",
        });
      } catch {
        startedForSub.current = null;
      }
    })();
  }, [isLoading, user, householdId, setSession, bootstrap]);

  return { user, isLoading };
}

/** bootstrapHouseholdSchema requires a real email; Auth0 `sub` is not one. */
function sanitizeEmail(email: string, sub: string): string {
  if (email.includes("@")) return email;
  const local = sub.replace(/[^a-zA-Z0-9]/g, "").slice(0, 40) || "user";
  return `${local}@users.noreply`;
}
