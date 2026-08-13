"use client";

import { Button } from "@expense-tracker/ui/button";

/** Full-page redirect (not next/link) so Auth0 middleware can start the flow. */
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
