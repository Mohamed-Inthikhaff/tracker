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
import { formatMoney } from "@expense-tracker/utils";
import { useCreateDebt, useDebts } from "../hooks/useDebts";
import type { DebtDirection, DebtStatus } from "../types/debt.types";

function statusTone(
  s: DebtStatus
): "under" | "near" | "over" | "default" {
  if (s === "Settled") return "under";
  if (s === "PartiallyPaid") return "near";
  if (s === "Outstanding") return "over";
  return "default";
}

export function DebtLedgerPanel() {
  const { data, isLoading, isError, error, refetch, isFetching } = useDebts();
  const create = useCreateDebt();

  const [personName, setPersonName] = useState("");
  const [direction, setDirection] = useState<DebtDirection>("OwedToMe");
  const [principal, setPrincipal] = useState("");
  const [openedDate, setOpenedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");

  const onCreate = () => {
    if (!personName.trim() || !principal) return;
    create.mutate(
      {
        personName: personName.trim(),
        direction,
        principalAmount: principal,
        openedDate: new Date(`${openedDate}T12:00:00.000Z`),
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setPersonName("");
          setPrincipal("");
          setNotes("");
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard
          label="Owed by household (I Owe)"
          value={formatMoney(data?.totalOwedByHousehold ?? "0.00")}
          tone="var(--type-debt-received)"
        />
        <KpiCard
          label="Owed to household"
          value={formatMoney(data?.totalOwedToHousehold ?? "0.00")}
          tone="var(--type-debt-given)"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Debt ledger</CardTitle>
            <CardDescription>
              Informal debts with auto-linked repayments (FR-DEBT-*).
            </CardDescription>
          </div>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            {isFetching ? "Refreshing…" : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <Input
              placeholder="Person"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />
            <Select
              value={direction}
              onChange={(e) => setDirection(e.target.value as DebtDirection)}
            >
              <option value="OwedToMe">Owed to me</option>
              <option value="IOwe">I owe</option>
            </Select>
            <Input
              placeholder="Principal"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              inputMode="decimal"
            />
            <Input
              type="date"
              value={openedDate}
              onChange={(e) => setOpenedDate(e.target.value)}
            />
            <Button
              onClick={onCreate}
              loading={create.isPending}
              disabled={!personName.trim() || !principal}
            >
              Add debt
            </Button>
          </div>
          <Input
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {create.isError ? (
            <p className="text-sm text-[var(--budget-over)]">
              {(create.error as Error).message}
            </p>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-[var(--text-secondary)]">Loading…</p>
          ) : isError ? (
            <p className="text-sm text-[var(--budget-over)]">
              {(error as Error)?.message || "Failed to load debts"}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-md border border-[var(--border-default)]">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-[var(--surface-base)] text-xs uppercase text-[var(--text-secondary)]">
                  <tr>
                    <th className="px-3 py-2 font-medium">Person</th>
                    <th className="px-3 py-2 font-medium">Direction</th>
                    <th className="px-3 py-2 font-medium">Opened</th>
                    <th className="px-3 py-2 font-medium text-right">Principal</th>
                    <th className="px-3 py-2 font-medium text-right">Repaid</th>
                    <th className="px-3 py-2 font-medium text-right">Remaining</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.debts ?? []).map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-[var(--border-default)]"
                    >
                      <td className="px-3 py-2">{d.personName}</td>
                      <td className="px-3 py-2">
                        {d.direction === "IOwe" ? "I owe" : "Owed to me"}
                      </td>
                      <td className="px-3 py-2 tabular-nums">{d.openedDate}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(d.principalAmount)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(d.repaidSoFar)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatMoney(d.remaining)}
                      </td>
                      <td className="px-3 py-2">
                        <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                      </td>
                    </tr>
                  ))}
                  {(data?.debts?.length ?? 0) === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-3 py-8 text-center text-[var(--text-secondary)]"
                      >
                        No debts yet. Log the principal above; repayments with
                        matching payee + type auto-link.
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
