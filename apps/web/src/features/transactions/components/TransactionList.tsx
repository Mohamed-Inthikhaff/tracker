"use client";

import { useState } from "react";
import { Input } from "@expense-tracker/ui/input";
import { Select } from "@expense-tracker/ui/select";
import { Button } from "@expense-tracker/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@expense-tracker/ui/card";
import { useTransactions } from "../hooks/useTransactions";
import { TransactionRow } from "./TransactionRow";
import type { TransactionType } from "../types/transaction.types";

export function TransactionList() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<TransactionType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data, isLoading, isError, error, refetch, isFetching } =
    useTransactions({
      q: q || undefined,
      type: type || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit: 100,
    });

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            Filter and search household activity (FR-TXN-005).
          </CardDescription>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            placeholder="Search description / payee"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType | "")}
          >
            <option value="">All types</option>
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
            <option value="Saving">Saving</option>
            <option value="DebtGiven">Debt given</option>
            <option value="DebtReceived">Debt received</option>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From date"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To date"
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
        ) : isError ? (
          <p className="text-sm text-[var(--budget-over)]">
            {(error as Error)?.message || "Failed to load transactions"}
          </p>
        ) : (
          <>
            <p className="text-sm text-[var(--text-secondary)]">
              {data?.total ?? 0} result{(data?.total ?? 0) === 1 ? "" : "s"}
            </p>
            <div className="overflow-x-auto rounded-md border border-[var(--border-default)]">
              <table className="w-full min-w-[40rem] text-left">
                <thead className="bg-[var(--surface-base)] text-xs uppercase tracking-wide text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Payee</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium text-right">Amount</th>
                    <th className="px-3 py-2 font-medium">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items ?? []).map((txn) => (
                    <TransactionRow key={txn.id} transaction={txn} />
                  ))}
                  {(data?.items?.length ?? 0) === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-3 py-8 text-center text-sm text-[var(--text-secondary)]"
                      >
                        No transactions yet. Import a CSV or add one manually.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
