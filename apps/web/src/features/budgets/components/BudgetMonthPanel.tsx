"use client";

import { useState } from "react";
import { Button } from "@expense-tracker/ui/button";
import { Input } from "@expense-tracker/ui/input";
import { Select } from "@expense-tracker/ui/select";
import { Badge } from "@expense-tracker/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@expense-tracker/ui/card";
import { KpiCard } from "@expense-tracker/ui/kpi-card";
import { currentMonthKey, formatMoney, monthKeysBack } from "@expense-tracker/utils";
import { useCategories } from "@/features/categories/hooks/useCategories";
import {
  useBudgetMonth,
  useCopyBudgetMonth,
  useSetBudget,
} from "../hooks/useBudgets";
import type { BudgetHealth } from "../types/budget.types";

function healthTone(
  h: BudgetHealth
): "under" | "near" | "over" {
  if (h === "Under") return "under";
  if (h === "Near") return "near";
  return "over";
}

export function BudgetMonthPanel() {
  const [month, setMonth] = useState(currentMonthKey());
  const months = monthKeysBack(14, month);
  const { data, isLoading, isError, error } = useBudgetMonth(month);
  const categories = useCategories({ type: "Expense" });
  const setBudget = useSetBudget(month);
  const copy = useCopyBudgetMonth();

  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");

  const onSet = () => {
    if (!categoryId || !amount) return;
    setBudget.mutate(
      { categoryId, month, budgetedAmount: amount },
      {
        onSuccess: () => {
          setAmount("");
        },
      }
    );
  };

  const onCopyFromPrev = () => {
    const keys = monthKeysBack(2, month);
    const from = keys[0];
    if (!from || from === month) return;
    copy.mutate({ fromMonth: from, toMonth: month });
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Budgets</CardTitle>
            <CardDescription>
              Monthly budget vs actual, variance, and health (FR-BUD-*).
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-36"
              aria-label="Budget month"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
            <Button
              variant="secondary"
              size="sm"
              loading={copy.isPending}
              onClick={onCopyFromPrev}
            >
              Copy prior month
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {data ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                label="Budgeted"
                value={formatMoney(data.totalBudgeted)}
                tone="var(--brand-primary)"
              />
              <KpiCard
                label="Actual"
                value={formatMoney(data.totalActual)}
                tone="var(--type-expense)"
              />
              <KpiCard
                label="Income"
                value={formatMoney(data.totalIncome)}
                tone="var(--type-income)"
              />
              <KpiCard
                label="Savings vs actual"
                value={
                  data.savingsRateVsActual === null
                    ? "—"
                    : `${data.savingsRateVsActual}%`
                }
                tone="var(--type-saving)"
                hint={
                  data.savingsRateVsBudgeted === null
                    ? undefined
                    : `vs budgeted ${data.savingsRateVsBudgeted}%`
                }
              />
            </div>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-[1fr_8rem_auto]">
            <Select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              aria-label="Category"
            >
              <option value="">Expense category…</option>
              {(categories.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
            />
            <Button
              loading={setBudget.isPending}
              onClick={onSet}
              disabled={!categoryId || !amount}
            >
              Set budget
            </Button>
          </div>
          {setBudget.isError ? (
            <p className="text-sm text-[var(--budget-over)]">
              {(setBudget.error as Error).message}
            </p>
          ) : null}
          {copy.isError ? (
            <p className="text-sm text-[var(--budget-over)]">
              {(copy.error as Error).message}
            </p>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-[var(--budget-over)]">
              {(error as Error)?.message || "Failed to load budgets"}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-[var(--border-default)]">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="bg-[var(--surface-base)] text-xs uppercase text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Category</th>
                    <th className="px-3 py-2 font-medium text-right">Budgeted</th>
                    <th className="px-3 py-2 font-medium text-right">Actual</th>
                    <th className="px-3 py-2 font-medium text-right">Variance</th>
                    <th className="px-3 py-2 font-medium text-right">% used</th>
                    <th className="px-3 py-2 font-medium">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.lines ?? []).map((line) => (
                    <tr
                      key={line.id}
                      className="border-t border-[var(--border-default)]"
                    >
                      <td className="px-3 py-2">{line.categoryName}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(line.budgetedAmount)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(line.actualAmount)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(line.variance)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {line.percentOfBudgetUsed === null
                          ? "—"
                          : `${line.percentOfBudgetUsed}%`}
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={healthTone(line.health)}>
                          {line.health}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {(data?.lines?.length ?? 0) === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-[var(--text-secondary)]"
                      >
                        No budgets for this month. Set one above or copy prior
                        month.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
