import { Input } from "@expense-tracker/ui/input";
import { Label } from "@expense-tracker/ui/label";
import { Select } from "@expense-tracker/ui/select";
import { Button } from "@expense-tracker/ui/button";
import type { TransactionType } from "../types/transaction.types";

export function TransactionListFilters({
  q,
  type,
  dateFrom,
  dateTo,
  isFetching,
  onQ,
  onType,
  onDateFrom,
  onDateTo,
  onRefresh,
}: {
  q: string;
  type: TransactionType | "";
  dateFrom: string;
  dateTo: string;
  isFetching: boolean;
  onQ: (value: string) => void;
  onType: (value: TransactionType | "") => void;
  onDateFrom: (value: string) => void;
  onDateTo: (value: string) => void;
  onRefresh: () => void;
}) {
  return (
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
            onChange={(e) => onQ(e.target.value)}
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
            onChange={(e) => onType(e.target.value as TransactionType | "")}
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
            onChange={(e) => onDateFrom(e.target.value)}
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
            onChange={(e) => onDateTo(e.target.value)}
          />
        </div>
      </div>
      <Button variant="secondary" size="sm" onClick={onRefresh}>
        {isFetching ? "Refreshing…" : "Refresh"}
      </Button>
    </div>
  );
}
