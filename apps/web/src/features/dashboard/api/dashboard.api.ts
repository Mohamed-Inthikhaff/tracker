import { monthKeysBack } from "@expense-tracker/utils";
import { transactionsApi } from "@/features/transactions/api/transactions.api";
import { categoriesApi } from "@/features/categories/api/categories.api";
import type {
  CategorySpendRow,
  TrendPoint,
} from "../types/dashboard.types";
import type { Transaction } from "@/features/transactions/types/transaction.types";

function monthBounds(month: string): { dateFrom: string; dateTo: string } {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    dateFrom: `${month}-01`,
    dateTo: `${month}-${String(last).padStart(2, "0")}`,
  };
}

function addMoney(a: string, b: string): string {
  return ((Math.round(Number(a) * 100) + Math.round(Number(b) * 100)) / 100).toFixed(
    2
  );
}

export const dashboardApi = {
  monthSummary: (month: string) => transactionsApi.summary({ month }),

  categoryBreakdown: async (month: string): Promise<CategorySpendRow[]> => {
    const { dateFrom, dateTo } = monthBounds(month);
    const [txns, categories] = await Promise.all([
      transactionsApi.list({
        type: "Expense",
        dateFrom,
        dateTo,
        limit: 500,
      }),
      categoriesApi.list({ type: "Expense", includeInactive: true }),
    ]);
    const nameById = new Map(categories.map((c) => [c.id, c.name]));
    const totals = new Map<string, string>();
    for (const t of txns.items as Transaction[]) {
      totals.set(t.categoryId, addMoney(totals.get(t.categoryId) ?? "0.00", t.amount));
    }
    return [...totals.entries()]
      .map(([categoryId, amount]) => ({
        categoryId,
        name: nameById.get(categoryId) ?? categoryId.slice(0, 8),
        amount,
      }))
      .sort((a, b) => Number(b.amount) - Number(a.amount));
  },

  trend: async (months = 12): Promise<TrendPoint[]> => {
    const keys = monthKeysBack(months);
    const summaries = await Promise.all(
      keys.map((month) => transactionsApi.summary({ month }))
    );
    return keys.map((month, i) => {
      const s = summaries[i]!;
      return {
        month,
        income: s.byType.Income,
        expense: s.byType.Expense,
        netBalance: s.netBalance,
      };
    });
  },
};
