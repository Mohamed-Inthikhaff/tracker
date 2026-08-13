"use client";

import { useMutation } from "@tanstack/react-query";
import { useHouseholdStore } from "@/stores/use-household-store";
import { authApi } from "../api/auth.api";

export function useBootstrap() {
  const setActiveHouseholdId = useHouseholdStore((s) => s.setActiveHouseholdId);

  return useMutation({
    mutationFn: authApi.bootstrap,
    onSuccess: (data) => {
      setActiveHouseholdId(data.household.id);
    },
  });
}
