"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../api/dashboard.api";
import { useHouseholdStore } from "@/stores/use-household-store";

export function useDashboardSummary(month: string) {
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey: ["dashboard", "summary", householdId, month],
    queryFn: () => dashboardApi.monthSummary(month),
    enabled: Boolean(householdId && month),
  });
}

export function useCategoryBreakdown(month: string) {
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey: ["dashboard", "breakdown", householdId, month],
    queryFn: () => dashboardApi.categoryBreakdown(month),
    enabled: Boolean(householdId && month),
  });
}

export function useIncomeExpenseTrend(months = 12) {
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey: ["dashboard", "trend", householdId, months],
    queryFn: () => dashboardApi.trend(months),
    enabled: Boolean(householdId),
  });
}
