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

export function DashboardHome() {
  const [month, setMonth] = useState(currentMonthKey());
  const months = monthKeysBack(14);
  const summary = useDashboardSummary(month);
  const breakdown = useCategoryBreakdown(month);
  const trend = useIncomeExpenseTrend(12);

  const maxTrend = Math.max(
    1,
    ...(trend.data ?? []).flatMap((p) => [
      Number(p.income) || 0,
      Number(p.expense) || 0,
    ])
  );
  const maxCat = Math.max(
    1,
    ...(breakdown.data ?? []).map((r) => Number(r.amount) || 0)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">
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
            <CardTitle>Category expense breakdown</CardTitle>
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
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-card)]">
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
            <CardTitle>12-month trend</CardTitle>
            <CardDescription>Income vs expense</CardDescription>
          </CardHeader>
          <CardContent>
            {trend.isLoading ? (
              <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
            ) : (
              <div className="flex h-48 items-end gap-1">
                {(trend.data ?? []).map((p) => {
                  const incH = (Number(p.income) / maxTrend) * 100;
                  const expH = (Number(p.expense) / maxTrend) * 100;
                  return (
                    <div
                      key={p.month}
                      className="flex flex-1 flex-col items-center justify-end gap-0.5"
                      title={`${p.month}: I ${p.income} / E ${p.expense}`}
                    >
                      <div className="flex w-full items-end justify-center gap-0.5">
                        <div
                          className="w-1/2 max-w-[0.6rem] rounded-t bg-[var(--type-income)]"
                          style={{ height: `${Math.max(incH, 2)}%` }}
                        />
                        <div
                          className="w-1/2 max-w-[0.6rem] rounded-t bg-[var(--type-expense)]"
                          style={{ height: `${Math.max(expH, 2)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[var(--text-secondary)]">
                        {p.month.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-3 text-xs text-[var(--text-secondary)]">
              <span className="text-[var(--type-income)]">■ Income</span>
              {" · "}
              <span className="text-[var(--type-expense)]">■ Expense</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
