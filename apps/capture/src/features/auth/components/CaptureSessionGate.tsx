"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useAuthStore } from "@/stores/use-auth-store";
import { useHouseholdStore } from "@/stores/use-household-store";
import { Auth0LoginButton } from "./Auth0LoginButton";

/** Session gate: Auth0 only (same tenant as web). */
export function CaptureSessionGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = useAuthStore((s) => s.accessToken);
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  const { user: auth0User, isLoading: auth0Loading } = useUser();

  if (auth0Loading || (auth0User && !(token && householdId))) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 text-sm text-[var(--text-secondary)]">
        Signing in to your household…
      </div>
    );
  }

  if (token && householdId) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold text-[var(--brand-primary)]">
        Capture sign-in
      </h1>
      <p className="text-sm text-[var(--text-secondary)]">
        Continue with Auth0, then enter an amount and tap a category to save.
      </p>
      <Auth0LoginButton />
    </div>
  );
}
