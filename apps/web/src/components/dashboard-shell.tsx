"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@expense-tracker/ui/button";
import { HouseholdSwitcher } from "@/features/households/components/HouseholdSwitcher";
import { useAuthStore } from "@/stores/use-auth-store";
import { useHouseholdStore } from "@/stores/use-household-store";
import { cn } from "@expense-tracker/ui/cn";

const nav = [
  { href: "/transactions", label: "Transactions" },
  { href: "/transactions/import", label: "Import" },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const clearHousehold = useHouseholdStore((s) => s.clear);

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [token, router]);

  if (!token) {
    return (
      <div className="min-h-screen grid place-items-center text-sm text-[var(--text-secondary)]">
        Redirecting to sign in…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface-base)]">
      <header className="border-b border-[var(--border-default)] bg-[var(--surface-card)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-base font-semibold tracking-tight text-[var(--brand-primary)]">
              Expense Tracker
            </span>
            <nav className="flex gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm",
                    pathname === item.href
                      ? "bg-[var(--brand-primary)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-base)]"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <HouseholdSwitcher />
            <span className="hidden text-sm text-[var(--text-secondary)] sm:inline">
              {user?.email}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                clearSession();
                clearHousehold();
                router.replace("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
