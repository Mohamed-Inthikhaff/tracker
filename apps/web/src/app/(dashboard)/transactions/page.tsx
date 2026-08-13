import { TransactionList } from "@/features/transactions/components/TransactionList";
import { MonthlyTotalsPanel } from "@/features/transactions/components/MonthlyTotalsPanel";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-serif text-xl font-semibold text-[var(--text-primary)]">
          Transactions
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Filter and search household activity (FR-TXN-005).
        </p>
      </div>
      <MonthlyTotalsPanel />
      <TransactionList />
    </div>
  );
}
