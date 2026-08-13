"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@expense-tracker/ui/card";
import { Auth0LoginButton } from "./Auth0LoginButton";

/** Product login: Auth0 only (FR-AUTH-001). */
export function LoginForm() {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [isLoading, user, router]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Continue with Auth0. Google is enabled on this tenant.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || user ? (
          <p className="text-sm text-[var(--text-secondary)]">Signing in…</p>
        ) : (
          <Auth0LoginButton />
        )}
      </CardContent>
    </Card>
  );
}
