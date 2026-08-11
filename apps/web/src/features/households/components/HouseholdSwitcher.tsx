"use client";

import { Select } from "@expense-tracker/ui/select";
import { useHouseholdStore } from "@/stores/use-household-store";
import { useMyHouseholds } from "../hooks/useHouseholds";

export function HouseholdSwitcher() {
  const { data, isLoading } = useMyHouseholds();
  const activeHouseholdId = useHouseholdStore((s) => s.activeHouseholdId);
  const setActiveHouseholdId = useHouseholdStore((s) => s.setActiveHouseholdId);
  const households = data ?? useHouseholdStore.getState().households;

  if (isLoading && households.length === 0) {
    return (
      <span className="text-sm text-[var(--text-secondary)]">Loading…</span>
    );
  }

  return (
    <Select
      aria-label="Active household"
      value={activeHouseholdId ?? ""}
      onChange={(e) => setActiveHouseholdId(e.target.value || null)}
      className="max-w-[14rem]"
    >
      {households.length === 0 ? (
        <option value="">No households</option>
      ) : (
        households.map((h) => (
          <option key={h.id} value={h.id}>
            {h.name} ({h.role})
          </option>
        ))
      )}
    </Select>
  );
}
