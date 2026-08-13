"use client";

import { useState } from "react";
import { Button } from "@expense-tracker/ui/button";
import { Input } from "@expense-tracker/ui/input";
import { Label } from "@expense-tracker/ui/label";
import { Select } from "@expense-tracker/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@expense-tracker/ui/card";
import { KpiCard } from "@expense-tracker/ui/kpi-card";
import {
  currentMonthKey,
  formatMoney,
  monthKeysBack,
} from "@expense-tracker/utils";
import { useCategories } from "@/features/categories/hooks/useCategories";
import {
  useBudgetMonth,
  useCopyBudgetMonth,
  useSetBudget,
} from "../hooks/useBudgets";
import { BudgetLinesTable } from "./BudgetLinesTable";

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
      { onSuccess: () => setAmount("") }
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-semibold text-[var(--text-primary)]">
            Budgets
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Monthly budget vs actual, variance, and health (FR-BUD-*).
          </p>
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
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Category budgets
          </CardTitle>
          <CardDescription>
            Set an expense category budget or copy last month’s amounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_8rem_auto]">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="budget-category"
                className="text-xs font-normal text-[var(--text-secondary)]"
              >
                Category
              </Label>
              <Select
                id="budget-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Expense category…</option>
                {(categories.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="budget-amount"
                className="text-xs font-normal text-[var(--text-secondary)]"
              >
                Amount
              </Label>
              <Input
                id="budget-amount"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                className="tabular-nums"
              />
            </div>
            <div className="flex items-end">
              <Button
                loading={setBudget.isPending}
                onClick={onSet}
                disabled={!categoryId || !amount}
              >
                Set budget
              </Button>
            </div>
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
            <BudgetLinesTable lines={data?.lines ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
