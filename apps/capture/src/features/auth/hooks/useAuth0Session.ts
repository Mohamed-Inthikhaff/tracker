"use client";

import { useEffect, useRef } from "react";
import { getAccessToken, useUser } from "@auth0/nextjs-auth0/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/use-auth-store";
import { useHouseholdStore } from "@/stores/use-household-store";
import { useBootstrap } from "./useAuth";

export function useAuth0Session() {
  const { user, isLoading } = useUser();
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  const bootstrap = useBootstrap();
  const queryClient = useQueryClient();
  const startedForSub = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading || !user?.sub) return;
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
        setAccessToken(token);
        if (!useHouseholdStore.getState().activeHouseholdId) {
          await bootstrap.mutateAsync({
            email,
            displayName,
            householdName: "My Household",
          });
        }
        await queryClient.invalidateQueries();
      } catch {
        startedForSub.current = null;
      }
    })();
  }, [isLoading, user, householdId, setAccessToken, bootstrap, queryClient]);

  return { user, isLoading };
}

function sanitizeEmail(email: string, sub: string): string {
  if (email.includes("@")) return email;
  const local = sub.replace(/[^a-zA-Z0-9]/g, "").slice(0, 40) || "user";
  return `${local}@users.noreply`;
}
