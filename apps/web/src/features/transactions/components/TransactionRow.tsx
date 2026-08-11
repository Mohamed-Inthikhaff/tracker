import { Badge } from "@expense-tracker/ui/badge";
import type { Transaction, TransactionType } from "../types/transaction.types";

const toneByType: Record<
  TransactionType,
  "income" | "expense" | "saving" | "debtGiven" | "debtReceived"
> = {
  Income: "income",
  Expense: "expense",
  Saving: "saving",
  DebtGiven: "debtGiven",
  DebtReceived: "debtReceived",
};

export function TransactionRow({ transaction }: { transaction: Transaction }) {
  return (
    <tr className="border-b border-[var(--border-default)] last:border-0">
      <td className="px-3 py-2.5 text-sm whitespace-nowrap">{transaction.date}</td>
      <td className="px-3 py-2.5">
        <Badge tone={toneByType[transaction.type]}>{transaction.type}</Badge>
      </td>
      <td className="px-3 py-2.5 text-sm text-[var(--text-secondary)]">
        {transaction.payee || "—"}
      </td>
      <td className="px-3 py-2.5 text-sm max-w-[16rem] truncate">
        {transaction.description || "—"}
      </td>
      <td className="px-3 py-2.5 text-sm text-right font-medium tabular-nums">
        {formatMoney(transaction.amount, transaction.currency)}
      </td>
      <td className="px-3 py-2.5 text-xs text-[var(--text-secondary)]">
        {transaction.source}
      </td>
    </tr>
  );
}

function formatMoney(amount: string, currency: string) {
  return `${currency} ${amount}`;
}
