import { TxnTypeRail, txnTypeToken } from "@expense-tracker/ui/txn-type-rail";
import type { Transaction, TransactionType } from "../types/transaction.types";

const TYPE_LABEL: Record<TransactionType, string> = {
  Income: "Income",
  Expense: "Expense",
  Saving: "Saving",
  DebtGiven: "Debt given",
  DebtReceived: "Debt received",
};

export function TransactionRow({ transaction }: { transaction: Transaction }) {
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
    </tr>
  );
}

function formatMoney(amount: string, currency: string) {
  return `${currency} ${amount}`;
}
