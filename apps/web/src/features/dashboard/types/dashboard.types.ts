import type { MonthlyTotalsSummary } from "@/features/transactions/types/transaction.types";

export interface DashboardMonthKpis {
  summary: MonthlyTotalsSummary;
}

export interface CategorySpendRow {
  categoryId: string;
  name: string;
  amount: string;
}

export interface TrendPoint {
  month: string;
  income: string;
  expense: string;
  netBalance: string;
}
