"use client";

import { useQuery } from "@tanstack/react-query";
import { householdsApi } from "../api/households.api";
import { useAuthStore } from "@/stores/use-auth-store";
import { useHouseholdStore } from "@/stores/use-household-store";
import { useEffect } from "react";

export function useMyHouseholds() {
  const token = useAuthStore((s) => s.accessToken);
  const setHouseholds = useHouseholdStore((s) => s.setHouseholds);
  const activeId = useHouseholdStore((s) => s.activeHouseholdId);
  const setActive = useHouseholdStore((s) => s.setActiveHouseholdId);

  const query = useQuery({
    queryKey: ["households", "mine"],
    queryFn: householdsApi.listMine,
    enabled: Boolean(token),
  });

  useEffect(() => {
    if (!query.data) return;
    setHouseholds(query.data);
    if (!activeId && query.data[0]) {
      setActive(query.data[0].id);
    }
  }, [query.data, activeId, setHouseholds, setActive]);

  return query;
}
