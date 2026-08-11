"use client";

import { useQuery } from "@tanstack/react-query";
import { categoriesApi } from "../api/categories.api";
import type { CategoryType } from "../types/category.types";
import { useHouseholdStore } from "@/stores/use-household-store";

export function useCategories(opts?: {
  type?: CategoryType;
  includeInactive?: boolean;
}) {
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);
  return useQuery({
    queryKey: ["categories", householdId, opts?.type, opts?.includeInactive],
    queryFn: () => categoriesApi.list(opts),
    enabled: Boolean(householdId),
  });
}
