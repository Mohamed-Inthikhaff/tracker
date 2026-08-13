"use client";

import { useState } from "react";
import { Card, CardContent } from "@expense-tracker/ui/card";
import { useTransactions } from "../hooks/useTransactions";
import { useDeleteTransaction } from "../hooks/useUpdateTransaction";
import { TransactionRow } from "./TransactionRow";
import { TransactionForm } from "./TransactionForm";
import { TransactionListFilters } from "./TransactionListFilters";
import {
  TRANSACTION_PAGE_SIZE,
  TransactionListPager,
} from "./TransactionListPager";
import type { Transaction, TransactionType } from "../types/transaction.types";

export function TransactionList() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<TransactionType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const offset = page * TRANSACTION_PAGE_SIZE;
  const remove = useDeleteTransaction();

  const { data, isLoading, isError, error, refetch, isFetching } =
    useTransactions({
      q: q || undefined,
      type: type || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: TRANSACTION_PAGE_SIZE,
      offset,
    });

  const resetPage = () => setPage(0);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-4">
        <TransactionListFilters
          q={q}
          type={type}
          dateFrom={dateFrom}
          dateTo={dateTo}
          isFetching={isFetching}
          onQ={(v) => {
            setQ(v);
            resetPage();
          }}
          onType={(v) => {
            setType(v);
            resetPage();
          }}
          onDateFrom={(v) => {
            setDateFrom(v);
            resetPage();
          }}
          onDateTo={(v) => {
            setDateTo(v);
            resetPage();
          }}
          onRefresh={() => refetch()}
        />

        {editing ? (
          <TransactionForm
            transaction={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => setEditing(null)}
          />
        ) : null}

        {isLoading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-[var(--budget-over)]">
            {(error as Error)?.message || "Failed to load transactions"}
          </p>
        ) : (
          <>
            <TransactionListPager
              total={data?.total ?? 0}
              limit={data?.limit ?? TRANSACTION_PAGE_SIZE}
              offset={data?.offset ?? offset}
              onPrev={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => p + 1)}
            />
            <div className="overflow-x-auto rounded-md border border-[var(--border-default)] bg-[var(--surface-base)]">
              <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-left">
                <thead className="bg-[var(--surface-card)] text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-3 py-1.5 font-medium">Date</th>
                    <th className="px-3 py-1.5 font-medium">Type</th>
                    <th className="px-3 py-1.5 font-medium">Payee</th>
                    <th className="px-3 py-1.5 font-medium">Description</th>
                    <th className="px-3 py-1.5 text-right font-medium">
                      Amount
                    </th>
                    <th className="px-3 py-1.5 font-medium">Source</th>
                    <th className="px-2 py-1.5 text-right font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items ?? []).map((txn) => (
                    <TransactionRow
                      key={txn.id}
                      transaction={txn}
                      confirmDelete={confirmDeleteId === txn.id}
                      deleting={
                        remove.isPending && remove.variables === txn.id
                      }
                      onEdit={() => {
                        setConfirmDeleteId(null);
                        setEditing(txn);
                      }}
                      onAskDelete={() => {
                        setEditing(null);
                        setConfirmDeleteId(txn.id);
                      }}
                      onCancelDelete={() => setConfirmDeleteId(null)}
                      onConfirmDelete={() =>
                        remove.mutate(txn.id, {
                          onSuccess: () => {
                            setConfirmDeleteId(null);
                            if (editing?.id === txn.id) setEditing(null);
                          },
                        })
                      }
                    />
                  ))}
                  {(data?.items?.length ?? 0) === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-6 text-center text-sm text-[var(--text-secondary)]"
                      >
                        No transactions yet. Import a CSV or add one from
                        Capture.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            {(data?.total ?? 0) > TRANSACTION_PAGE_SIZE ? (
              <TransactionListPager
                total={data?.total ?? 0}
                limit={data?.limit ?? TRANSACTION_PAGE_SIZE}
                offset={data?.offset ?? offset}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            ) : null}
            {remove.isError ? (
              <p className="text-sm text-[var(--budget-over)]">
                {(remove.error as Error).message}
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
