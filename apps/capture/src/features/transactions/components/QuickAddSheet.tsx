"use client";

import { useMemo, useState } from "react";
import { AmountInput } from "@expense-tracker/ui/amount-input";
import { Button } from "@expense-tracker/ui/button";
import { TxnTypeRail, txnTypeToken } from "@expense-tracker/ui/txn-type-rail";
import {
  useCategories,
  useCreateTransaction,
  useRecentQuickAdds,
} from "../hooks/useCreateTransaction";
import type { TransactionType } from "../types/transaction.types";
import { moneyAmountSchema } from "../schema/transaction.schema";

/**
 * Two-tap quick-add: (1) category chip  (2) Save with amount already set.
 * FR-TXN-002 / NFR-PERF-001 — amount + category only for common case.
 */
export function QuickAddSheet() {
  const { data: categories, isLoading: catsLoading } = useCategories("Expense");
  const create = useCreateTransaction();
  const recent = useRecentQuickAdds();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [type] = useState<TransactionType>("Expense");
  const [flash, setFlash] = useState<string | null>(null);

  const amountOk = useMemo(() => {
    const r = moneyAmountSchema.safeParse(amount);
    return r.success;
  }, [amount]);

  const selected = categories?.find((c) => c.id === categoryId);

  const onSave = () => {
    if (!amountOk || !categoryId) return;
    create.mutate(
      {
        date: new Date(),
        type,
        categoryId,
        amount,
        source: "manual",
      },
      {
        onSuccess: () => {
          setFlash(`Saved ${amount}${selected ? ` · ${selected.name}` : ""}`);
          setAmount("");
          // keep category for successive two-tap adds of same merchant type
          window.setTimeout(() => setFlash(null), 1800);
        },
      }
    );
  };

  const canSave = amountOk && Boolean(categoryId) && !create.isPending;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--brand-primary)]">
          Quick add
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Enter amount, tap a category, then Save — two steps after the amount
          (FR-TXN-002).
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          Amount
        </label>
        <AmountInput
          value={amount}
          onValueChange={setAmount}
          placeholder="0.00"
          autoFocus
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          Category
        </label>
        {catsLoading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(categories ?? []).map((c) => {
              const active = c.id === categoryId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryId(c.id)}
                  className={
                    active
                      ? "rounded-full border border-[var(--type-expense)] bg-[var(--type-expense)]/15 px-3 py-1.5 text-sm font-medium text-[var(--type-expense)]"
                      : "rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-3 py-1.5 text-sm text-[var(--text-primary)]"
                  }
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Button
        size="lg"
        className="w-full"
        loading={create.isPending}
        disabled={!canSave}
        onClick={onSave}
      >
        {create.isPending ? "Saving…" : "Save"}
      </Button>

      {create.isError ? (
        <p className="text-center text-sm text-[var(--budget-over)]">
          {(create.error as Error).message}
        </p>
      ) : null}
      {flash ? (
        <p className="text-center text-sm font-medium text-[var(--type-income)]">
          {flash}
        </p>
      ) : null}

      {(recent.data?.length ?? 0) > 0 ? (
        <div className="border-t border-[var(--border-default)] pt-4">
          <p className="mb-2 text-xs uppercase text-[var(--text-secondary)]">
            Just saved
          </p>
          <ul className="flex flex-col text-sm">
            {(recent.data ?? []).slice(0, 5).map((t, i, list) => (
              <li key={t.id}>
                <TxnTypeRail
                  type={t.type}
                  className={`flex justify-between gap-2 ${
                    t.id.startsWith("optimistic") ? "opacity-70" : ""
                  } ${i === list.length - 1 ? "border-b-0" : ""}`}
                >
                  <span className="text-[var(--text-secondary)]">{t.date}</span>
                  <span
                    className="font-medium tabular-nums"
                    style={{ color: txnTypeToken(t.type) }}
                  >
                    {t.amount}
                  </span>
                </TxnTypeRail>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
