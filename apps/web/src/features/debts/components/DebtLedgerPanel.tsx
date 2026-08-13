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
import { formatMoney } from "@expense-tracker/utils";
import { useCreateDebt, useDebts } from "../hooks/useDebts";
import type { DebtDirection } from "../types/debt.types";
import { DebtLinesTable } from "./DebtLinesTable";

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-semibold text-[var(--text-primary)]">
            Debts
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Informal debts with auto-linked repayments (FR-DEBT-*).
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          {isFetching ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard
          label="Owed by household"
          value={formatMoney(data?.totalOwedByHousehold ?? "0.00")}
          tone="var(--type-debt-received)"
          hint="I owe — money borrowed"
        />
        <KpiCard
          label="Owed to household"
          value={formatMoney(data?.totalOwedToHousehold ?? "0.00")}
          tone="var(--type-debt-given)"
          hint="Owed to me — money lent"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Add debt</CardTitle>
          <CardDescription>
            Person, direction, principal, and opened date. Notes optional.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="debt-person"
                className="text-xs font-normal text-[var(--text-secondary)]"
              >
                Person
              </Label>
              <Input
                id="debt-person"
                placeholder="Name"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="debt-direction"
                className="text-xs font-normal text-[var(--text-secondary)]"
              >
                Direction
              </Label>
              <Select
                id="debt-direction"
                value={direction}
                onChange={(e) =>
                  setDirection(e.target.value as DebtDirection)
                }
              >
                <option value="OwedToMe">Owed to me</option>
                <option value="IOwe">I owe</option>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="debt-principal"
                className="text-xs font-normal text-[var(--text-secondary)]"
              >
                Principal
              </Label>
              <Input
                id="debt-principal"
                placeholder="0.00"
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                inputMode="decimal"
                className="tabular-nums"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label
                htmlFor="debt-opened"
                className="text-xs font-normal text-[var(--text-secondary)]"
              >
                Date
              </Label>
              <Input
                id="debt-opened"
                type="date"
                value={openedDate}
                onChange={(e) => setOpenedDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={onCreate}
                loading={create.isPending}
                disabled={!personName.trim() || !principal}
              >
                Add debt
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="debt-notes"
              className="text-xs font-normal text-[var(--text-secondary)]"
            >
              Notes
            </Label>
            <Input
              id="debt-notes"
              placeholder="Optional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
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
            <DebtLinesTable debts={data?.debts ?? []} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
