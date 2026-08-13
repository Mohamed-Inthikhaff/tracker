"use client";

import { useState } from "react";
import { Select } from "@expense-tracker/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@expense-tracker/ui/card";
import { KpiCard } from "@expense-tracker/ui/kpi-card";
import { currentMonthKey, formatMoney, monthKeysBack } from "@expense-tracker/utils";
import {
  useCategoryBreakdown,
  useDashboardSummary,
  useIncomeExpenseTrend,
} from "../hooks/useDashboard";
import { IncomeExpenseTrendChart } from "./IncomeExpenseTrendChart";

export function DashboardHome() {
  const [month, setMonth] = useState(currentMonthKey());
  const months = monthKeysBack(14);
  const summary = useDashboardSummary(month);
  const breakdown = useCategoryBreakdown(month);
  const trend = useIncomeExpenseTrend(12);

  const maxCat = Math.max(
    1,
    ...(breakdown.data ?? []).map((r) => Number(r.amount) || 0)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-semibold text-[var(--text-primary)]">
            Dashboard
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Income, expense, saving, and category spend for the selected month
            (FR-DASH-001–003).
          </p>
        </div>
        <Select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-36"
          aria-label="Dashboard month"
        >
          {months.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>

      {summary.isLoading ? (
        <p className="text-sm text-[var(--text-secondary)]">Loading KPIs…</p>
      ) : summary.isError ? (
        <p className="text-sm text-[var(--budget-over)]">
          {(summary.error as Error).message}
        </p>
      ) : summary.data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            label="Income"
            value={formatMoney(summary.data.byType.Income)}
            tone="var(--type-income)"
          />
          <KpiCard
            label="Expense"
            value={formatMoney(summary.data.byType.Expense)}
            tone="var(--type-expense)"
          />
          <KpiCard
            label="Saving"
            value={formatMoney(summary.data.byType.Saving)}
            tone="var(--type-saving)"
          />
          <KpiCard
            label="Net balance"
            value={formatMoney(summary.data.netBalance)}
            tone="var(--brand-primary)"
            hint={`${summary.data.count} transactions`}
          />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Category expense breakdown</CardTitle>
            <CardDescription>Sorted by amount for {month}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {breakdown.isLoading ? (
              <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
            ) : (breakdown.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No expense activity this month.
              </p>
            ) : (
              (breakdown.data ?? []).slice(0, 12).map((row) => (
                <div key={row.categoryId} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span>{row.name}</span>
                    <span className="tabular-nums text-[var(--type-expense)]">
                      {formatMoney(row.amount)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-base)]">
                    <div
                      className="h-full rounded-full bg-[var(--type-expense)]"
                      style={{
                        width: `${Math.min(
                          100,
                          (Number(row.amount) / maxCat) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">12-month trend</CardTitle>
            <CardDescription>Income vs expense</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.isLoading ? (
              <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
            ) : trend.isError ? (
              <p className="text-sm text-[var(--budget-over)]">
                {(trend.error as Error).message}
              </p>
            ) : (trend.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">
                No monthly totals yet. Import or add transactions to see income
                vs expense over time.
              </p>
            ) : (
              <IncomeExpenseTrendChart points={trend.data ?? []} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
