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
import { TypeSelector } from "./TypeSelector";
import { CategoryChips } from "./CategoryChips";

/**
 * Two-tap quick-add: (1) category chip  (2) Save with amount already set.
 * FR-TXN-002 / NFR-PERF-001 — amount + category only for common case.
 */
export function QuickAddSheet() {
  const [type, setType] = useState<TransactionType>("Expense");
  const {
    data: categories,
    isLoading: catsLoading,
    isError: catsError,
  } = useCategories(type);
  const create = useCreateTransaction();
  const recent = useRecentQuickAdds();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const amountOk = useMemo(() => {
    const r = moneyAmountSchema.safeParse(amount);
    return r.success;
  }, [amount]);

  const selected = categories?.find((c) => c.id === categoryId);

  const onTypeChange = (next: TransactionType) => {
    setType(next);
    setCategoryId(null);
  };

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
          window.setTimeout(() => setFlash(null), 1800);
        },
      }
    );
  };

  const canSave = amountOk && Boolean(categoryId) && !create.isPending;
  const recents = (recent.data ?? []).slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
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
          className="bg-[var(--surface-card)]"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          Type
        </label>
        <TypeSelector value={type} onChange={onTypeChange} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)]">
          Category
        </label>
        {catsLoading ? (
          <p className="text-sm text-[var(--text-secondary)]">
            Loading categories…
          </p>
        ) : catsError ? (
          <p className="text-sm text-[var(--budget-over)]">
            Couldn’t load categories. Switch account or check you’re still
            signed in, then try again.
          </p>
        ) : (
          <CategoryChips
            type={type}
            categories={categories ?? []}
            selectedId={categoryId}
            onSelect={setCategoryId}
          />
        )}
      </div>

      <Button
        size="touch"
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

      {recents.length > 0 ? (
        <div className="pt-2">
          <p className="mb-2 text-xs uppercase tracking-wide text-[var(--text-secondary)]">
            Just saved
          </p>
          <ul className="flex flex-col gap-2">
            {recents.map((t) => (
              <li key={t.id}>
                <TxnTypeRail
                  variant="block"
                  type={t.type}
                  className={`flex min-h-11 items-center justify-between gap-3 rounded-md border-b-0 bg-[var(--surface-card)] py-3 pr-3 ${
                    t.id.startsWith("optimistic") ? "opacity-70" : ""
                  }`}
                >
                  <span className="text-sm text-[var(--text-secondary)]">
                    {t.date}
                  </span>
                  <span
                    className="text-sm font-medium tabular-nums"
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
