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
import { useAcceptInvite } from "../hooks/useAuth";

export function InviteAcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const accept = useAcceptInvite();
  const [email, setEmail] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accessToken.trim() || !email.trim()) {
      setError("Email and access token are required.");
      return;
    }
    setSession(accessToken.trim(), {
      sub: `invitee|${email}`,
      email,
    });
    try {
      await accept.mutateAsync(token);
      router.replace("/transactions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite acceptance failed");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Accept invite</CardTitle>
        <CardDescription>
          Sign in with the invited email to join the household (FR-AUTH-003).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-email">Invited email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="invite-token">Access token (JWT)</Label>
            <textarea
              id="invite-token"
              className="min-h-24 w-full rounded-md border border-[var(--border-default)] bg-[var(--surface-base)] px-3 py-2 text-sm"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="text-sm text-[var(--budget-over)]">{error}</p>
          ) : null}
          <Button type="submit" loading={accept.isPending}>
            Join household
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
