"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HouseholdState {
  activeHouseholdId: string | null;
  setActiveHouseholdId: (id: string | null) => void;
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      activeHouseholdId: null,
      setActiveHouseholdId: (activeHouseholdId) => set({ activeHouseholdId }),
    }),
    { name: "et-capture-household" }
  )
);
