"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Select } from "@expense-tracker/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@expense-tracker/ui/card";
import { useHouseholdStore } from "@/stores/use-household-store";
import { transactionsApi } from "../api/transactions.api";

const MONTHS = [
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
  "2026-06",
  "2026-07",
  "2026-08",
];

/** Expected Dashboard values for the acceptance spreadsheet (Aug 2026 cards). */
const DASHBOARD_AUG = {
  Income: "72452.00",
  Expense: "45481.00",
  netBalance: "26971.00",
};

export function MonthlyTotalsPanel() {
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  const [month, setMonth] = useState("2026-08");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["transactions", "summary", householdId, month],
    queryFn: () => transactionsApi.summary({ month }),
    enabled: Boolean(householdId),
  });

  const matchesAug =
    month === "2026-08" &&
    data &&
    data.byType.Income === DASHBOARD_AUG.Income &&
    data.byType.Expense === DASHBOARD_AUG.Expense &&
    data.netBalance === DASHBOARD_AUG.netBalance;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Monthly totals</CardTitle>
          <CardDescription>
            Phase 0 exit check vs spreadsheet Dashboard (Income / Expense /
            Net).
          </CardDescription>
        </div>
        <Select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-36"
          aria-label="Summary month"
        >
          {MONTHS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-[var(--budget-over)]">
            {(error as Error)?.message || "Failed to load summary"}
          </p>
        ) : data ? (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-4">
              <Kpi
                label="Income"
                value={data.byType.Income}
                tone="var(--type-income)"
              />
              <Kpi
                label="Expense"
                value={data.byType.Expense}
                tone="var(--type-expense)"
              />
              <Kpi
                label="Saving"
                value={data.byType.Saving}
                tone="var(--type-saving)"
              />
              <Kpi
                label="Net balance"
                value={data.netBalance}
                tone="var(--brand-primary)"
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              {data.count} transactions · {data.dateFrom} → {data.dateTo}
              {month === "2026-08" ? (
                <>
                  {" "}
                  · Dashboard target I {DASHBOARD_AUG.Income} / E{" "}
                  {DASHBOARD_AUG.Expense} / Net {DASHBOARD_AUG.netBalance}
                  {matchesAug ? (
                    <span className="text-[var(--type-income)]">
                      {" "}
                      · match ✓
                    </span>
                  ) : (
                    <span className="text-[var(--type-expense)]">
                      {" "}
                      · mismatch — see docs/phase0-exit-verification.md
                    </span>
                  )}
                </>
              ) : null}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-md border border-[var(--border-default)] bg-[var(--surface-base)] p-3">
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums" style={{ color: tone }}>
        {value}
      </p>
    </div>
  );
}
