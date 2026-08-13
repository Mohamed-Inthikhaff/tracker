"use client";

import { Button } from "@expense-tracker/ui/button";

export function Auth0LoginButton({
  label = "Continue with Auth0",
  returnTo = "/",
}: {
  label?: string;
  returnTo?: string;
}) {
  return (
    <Button
      type="button"
      className="w-full"
      onClick={() => {
        window.location.assign(
          `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
        );
      }}
    >
      {label}
    </Button>
  );
}
