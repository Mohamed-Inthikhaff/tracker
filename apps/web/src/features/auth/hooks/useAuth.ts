"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api/auth.api";
import { useHouseholdStore } from "@/stores/use-household-store";

export function useBootstrap() {
  const setActiveHouseholdId = useHouseholdStore((s) => s.setActiveHouseholdId);
  const setHouseholds = useHouseholdStore((s) => s.setHouseholds);

  return useMutation({
    mutationFn: authApi.bootstrap,
    onSuccess: (data) => {
      setActiveHouseholdId(data.household.id);
      setHouseholds([
        {
          id: data.household.id,
          name: data.household.name,
          baseCurrency: data.household.baseCurrency,
          role: data.household.role,
        },
      ]);
    },
  });
}

export function useAcceptInvite() {
  const setActiveHouseholdId = useHouseholdStore((s) => s.setActiveHouseholdId);

  return useMutation({
    mutationFn: authApi.acceptInvite,
    onSuccess: (data) => {
      setActiveHouseholdId(data.id);
    },
  });
}
