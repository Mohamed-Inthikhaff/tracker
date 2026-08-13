"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Button } from "@expense-tracker/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@expense-tracker/ui/card";
import { useAuthStore } from "@/stores/use-auth-store";
import { useAcceptInvite } from "../hooks/useAuth";
import { Auth0LoginButton } from "./Auth0LoginButton";

export function InviteAcceptForm({ token }: { token: string }) {
  const router = useRouter();
  const { user, isLoading } = useUser();
  const accessToken = useAuthStore((s) => s.accessToken);
  const accept = useAcceptInvite();
  const [error, setError] = useState<string | null>(null);

  async function onJoin() {
    setError(null);
    try {
      await accept.mutateAsync(token);
      router.replace("/transactions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invite acceptance failed");
    }
  }

  if (isLoading || (user && !accessToken)) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept invite</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)]">Signing in…</p>
        </CardContent>
      </Card>
    );
  }

  if (!user || !accessToken) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Accept invite</CardTitle>
          <CardDescription>
            Sign in with the invited email to join the household (FR-AUTH-003).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth0LoginButton returnTo={`/invite/${token}`} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Accept invite</CardTitle>
        <CardDescription>
          Join as {user.email ?? "this Auth0 account"} (FR-AUTH-003).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <p className="text-sm text-[var(--budget-over)]">{error}</p>
        ) : null}
        <Button onClick={onJoin} loading={accept.isPending}>
          Join household
        </Button>
      </CardContent>
    </Card>
  );
}
