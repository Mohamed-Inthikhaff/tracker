"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@expense-tracker/ui/button";
import { Input } from "@expense-tracker/ui/input";
import { Label } from "@expense-tracker/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@expense-tracker/ui/card";
import { useAuthStore } from "@/stores/use-auth-store";
import { useBootstrap } from "../hooks/useAuth";

/**
 * Phase 0 login: JWT is issued outside Auth0 (dev signed token).
 * After token is stored, bootstrap creates/loads the default household.
 */
export function LoginForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const bootstrap = useBootstrap();

  const [email, setEmail] = useState("owner@example.com");
  const [displayName, setDisplayName] = useState("Owner");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accessToken.trim()) {
      setError("Access token is required (signed JWT from the API).");
      return;
    }

    const sub = decodeSub(accessToken) || `local|${email}`;
    setSession(accessToken.trim(), {
      sub,
      email,
      displayName,
    });

    try {
      await bootstrap.mutateAsync({
        email,
        displayName,
        householdName: "My Household",
      });
      router.replace("/transactions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Phase 0 uses a signed JWT (same contract as FR-AUTH-001 Auth0 tokens).
          Provide token + email, then we bootstrap your default household.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Display name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="token">Access token (JWT)</Label>
            <textarea
              id="token"
              className="min-h-24 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-base)] px-3 py-2 text-sm"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-[var(--budget-over)]">{error}</p>
          ) : null}
          <Button type="submit" loading={bootstrap.isPending}>
            Continue
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function decodeSub(token: string): string | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof json.sub === "string" ? json.sub : null;
  } catch {
    return null;
  }
}
