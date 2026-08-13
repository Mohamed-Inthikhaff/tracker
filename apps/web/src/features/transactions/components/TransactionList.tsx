"use client";

import { useState } from "react";
import { Input } from "@expense-tracker/ui/input";
import { Label } from "@expense-tracker/ui/label";
import { Select } from "@expense-tracker/ui/select";
import { Button } from "@expense-tracker/ui/button";
import { Card, CardContent } from "@expense-tracker/ui/card";
import { useTransactions } from "../hooks/useTransactions";
import { TransactionRow } from "./TransactionRow";
import {
  TRANSACTION_PAGE_SIZE,
  TransactionListPager,
} from "./TransactionListPager";
import type { TransactionType } from "../types/transaction.types";

export function TransactionList() {
  const [q, setQ] = useState("");
  const [type, setType] = useState<TransactionType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const offset = page * TRANSACTION_PAGE_SIZE;

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
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="txn-search"
                className="text-xs font-normal text-[var(--text-secondary)]"
              >
                Search
              </Label>
              <Input
                id="txn-search"
                placeholder="Description or payee"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="txn-type"
                className="text-xs font-normal text-[var(--text-secondary)]"
              >
                Type
              </Label>
              <Select
                id="txn-type"
                value={type}
                onChange={(e) => {
                  setType(e.target.value as TransactionType | "");
                  resetPage();
                }}
              >
                <option value="">All types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
                <option value="Saving">Saving</option>
                <option value="DebtGiven">Debt given</option>
                <option value="DebtReceived">Debt received</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="txn-from"
                className="text-xs font-normal text-[var(--text-secondary)]"
              >
                From
              </Label>
              <Input
                id="txn-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="txn-to"
                className="text-xs font-normal text-[var(--text-secondary)]"
              >
                To
              </Label>
              <Input
                id="txn-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  resetPage();
                }}
              />
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

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
              <table className="w-full min-w-[40rem] border-separate border-spacing-0 text-left">
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
          </>
        )}
      </CardContent>
    </Card>
  );
}
