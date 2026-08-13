"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@expense-tracker/ui/button";
import { Input } from "@expense-tracker/ui/input";
import { Label } from "@expense-tracker/ui/label";
import { Select } from "@expense-tracker/ui/select";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useUpdateTransaction } from "../hooks/useUpdateTransaction";
import type {
  Transaction,
  TransactionType,
  UpdateTransactionInput,
} from "../types/transaction.types";

/**
 * FR-TXN-003 edit form — scaffolded in the implementation plan as
 * TransactionForm; wired here for row-level edit (no prior unused file).
 */
export function TransactionForm({
  transaction,
  onCancel,
  onSaved,
}: {
  transaction: Transaction;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const update = useUpdateTransaction();
  const [date, setDate] = useState(transaction.date);
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [amount, setAmount] = useState(transaction.amount);
  const [description, setDescription] = useState(
    transaction.description ?? ""
  );
  const [payee, setPayee] = useState(transaction.payee ?? "");

  const categories = useCategories({ type });

  useEffect(() => {
    setDate(transaction.date);
    setType(transaction.type);
    setCategoryId(transaction.categoryId);
    setAmount(transaction.amount);
    setDescription(transaction.description ?? "");
    setPayee(transaction.payee ?? "");
  }, [transaction]);

  useEffect(() => {
    const list = categories.data ?? [];
    if (list.length === 0) return;
    if (!list.some((c) => c.id === categoryId)) {
      setCategoryId(list[0]!.id);
    }
  }, [categories.data, categoryId]);

  const onSubmit = () => {
    const input: UpdateTransactionInput = {};
    if (date !== transaction.date) {
      input.date = new Date(`${date}T12:00:00.000Z`);
    }
    if (type !== transaction.type) input.type = type;
    if (categoryId !== transaction.categoryId) input.categoryId = categoryId;
    if (amount !== transaction.amount) input.amount = amount;
    if ((description || "") !== (transaction.description ?? "")) {
      input.description = description;
    }
    if ((payee || "") !== (transaction.payee ?? "")) input.payee = payee;

    if (Object.keys(input).length === 0) {
      onCancel();
      return;
    }

    update.mutate(
      { id: transaction.id, input },
      { onSuccess: () => onSaved() }
    );
  };

  return (
    <div className="rounded-md border border-[var(--border-default)] bg-[var(--surface-card)] p-3">
      <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
        Edit transaction
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Date" htmlFor="txn-edit-date">
          <Input
            id="txn-edit-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Type" htmlFor="txn-edit-type">
          <Select
            id="txn-edit-type"
            value={type}
            onChange={(e) => setType(e.target.value as TransactionType)}
          >
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
            <option value="Saving">Saving</option>
            <option value="DebtGiven">Debt given</option>
            <option value="DebtReceived">Debt received</option>
          </Select>
        </Field>
        <Field label="Category" htmlFor="txn-edit-category">
          <Select
            id="txn-edit-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Amount" htmlFor="txn-edit-amount">
          <Input
            id="txn-edit-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
          />
        </Field>
        <Field label="Payee" htmlFor="txn-edit-payee">
          <Input
            id="txn-edit-payee"
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
          />
        </Field>
        <Field label="Description" htmlFor="txn-edit-description">
          <Input
            id="txn-edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          loading={update.isPending}
          onClick={onSubmit}
        >
          Save changes
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={update.isPending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        {update.isError ? (
          <p className="text-sm text-[var(--budget-over)]">
            {(update.error as Error).message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <Label
        htmlFor={htmlFor}
        className="text-xs font-normal text-[var(--text-secondary)]"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
