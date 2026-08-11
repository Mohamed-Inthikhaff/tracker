"use client";

import { useState } from "react";
import { Button } from "@expense-tracker/ui/button";
import { Input } from "@expense-tracker/ui/input";
import { Label } from "@expense-tracker/ui/label";
import { useAuthStore } from "@/stores/use-auth-store";
import { useHouseholdStore } from "@/stores/use-household-store";

/** Session gate using same JWT + household as web (Phase 0 contract). */
export function CaptureSessionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = useAuthStore((s) => s.accessToken);
  const setToken = useAuthStore((s) => s.setAccessToken);
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  const setHousehold = useHouseholdStore((s) => s.setActiveHouseholdId);

  const [localToken, setLocalToken] = useState(token ?? "");
  const [localHh, setLocalHh] = useState(householdId ?? "");

  if (token && householdId) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold text-[var(--brand-primary)]">
        Capture sign-in
      </h1>
      <p className="text-sm text-[var(--text-secondary)]">
        Paste the same JWT and household id used in the web app (header{" "}
        <code className="text-xs">X-Household-Id</code>).
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="token">Access token</Label>
        <Input
          id="token"
          value={localToken}
          onChange={(e) => setLocalToken(e.target.value)}
          placeholder="JWT…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hh">Household id</Label>
        <Input
          id="hh"
          value={localHh}
          onChange={(e) => setLocalHh(e.target.value)}
          placeholder="UUID…"
        />
      </div>
      <Button
        onClick={() => {
          setToken(localToken.trim());
          setHousehold(localHh.trim());
        }}
        disabled={!localToken.trim() || !localHh.trim()}
      >
        Continue
      </Button>
    </div>
  );
}
