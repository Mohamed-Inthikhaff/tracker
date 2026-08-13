import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@expense-tracker/ui/button";
import { TxnTypeRail, txnTypeToken } from "@expense-tracker/ui/txn-type-rail";
import type { Transaction, TransactionType } from "../types/transaction.types";

const TYPE_LABEL: Record<TransactionType, string> = {
  Income: "Income",
  Expense: "Expense",
  Saving: "Saving",
  DebtGiven: "Debt given",
  DebtReceived: "Debt received",
};

export function TransactionRow({
  transaction,
  confirmDelete,
  deleting,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  transaction: Transaction;
  confirmDelete: boolean;
  deleting: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  const tone = txnTypeToken(transaction.type);
  return (
    <tr className="border-b border-[var(--border-default)] last:border-b-0">
      <TxnTypeRail variant="cell" type={transaction.type}>
        {transaction.date}
      </TxnTypeRail>
      <td className="px-3 py-1.5 text-sm text-[var(--text-primary)]">
        {TYPE_LABEL[transaction.type]}
      </td>
      <td className="px-3 py-1.5 text-sm text-[var(--text-secondary)]">
        {transaction.payee || "—"}
      </td>
      <td className="max-w-[16rem] truncate px-3 py-1.5 text-sm text-[var(--text-primary)]">
        {transaction.description || "—"}
      </td>
      <td
        className="px-3 py-1.5 text-right text-sm font-medium tabular-nums"
        style={{ color: tone }}
      >
        {formatMoney(transaction.amount, transaction.currency)}
      </td>
      <td className="px-3 py-1.5 text-xs text-[var(--text-secondary)]">
        {transaction.source}
      </td>
      <td className="px-2 py-1.5 text-right">
        {confirmDelete ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={onConfirmDelete}
            >
              Confirm
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={deleting}
              onClick={onCancelDelete}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 px-0 text-[var(--text-secondary)]"
              aria-label="Edit transaction"
              onClick={onEdit}
            >
              <Pencil width={14} height={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 px-0 text-[var(--text-secondary)]"
              aria-label="Delete transaction"
              onClick={onAskDelete}
            >
              <Trash2 width={14} height={14} />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

function formatMoney(amount: string, currency: string) {
  return `${currency} ${amount}`;
}
