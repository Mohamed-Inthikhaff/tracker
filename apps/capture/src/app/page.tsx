"use client";

import { QuickAddSheet } from "@/features/transactions/components/QuickAddSheet";
import { CaptureSessionGate } from "@/features/auth/components/CaptureSessionGate";
import { Button } from "@expense-tracker/ui/button";
import { useAuthStore } from "@/stores/use-auth-store";
import { useHouseholdStore } from "@/stores/use-household-store";

export default function CaptureHomePage() {
  const clearAuth = useAuthStore((s) => s.setAccessToken);
  const clearHh = useHouseholdStore((s) => s.setActiveHouseholdId);

  return (
    <CaptureSessionGate>
      <div className="min-h-screen bg-[var(--surface-base)]">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 pt-3">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
            Capture
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearAuth(null);
              clearHh(null);
            }}
          >
            Switch account
          </Button>
        </div>
        <QuickAddSheet />
      </div>
    </CaptureSessionGate>
  );
}
