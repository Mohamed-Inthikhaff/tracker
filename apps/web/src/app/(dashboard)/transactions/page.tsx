import { TransactionList } from "@/features/transactions/components/TransactionList";
import { MonthlyTotalsPanel } from "@/features/transactions/components/MonthlyTotalsPanel";

export default function TransactionsPage() {
  return (
    <div className="flex flex-col gap-4">
      <MonthlyTotalsPanel />
      <TransactionList />
    </div>
  );
}
