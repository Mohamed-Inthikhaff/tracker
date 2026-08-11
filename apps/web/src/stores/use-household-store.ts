"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HouseholdOption {
  id: string;
  name: string;
  baseCurrency: string;
  role: string;
}

interface HouseholdState {
  activeHouseholdId: string | null;
  households: HouseholdOption[];
  setActiveHouseholdId: (id: string | null) => void;
  setHouseholds: (list: HouseholdOption[]) => void;
  clear: () => void;
}

export const useHouseholdStore = create<HouseholdState>()(
  persist(
    (set) => ({
      activeHouseholdId: null,
      households: [],
      setActiveHouseholdId: (activeHouseholdId) => set({ activeHouseholdId }),
      setHouseholds: (households) => set({ households }),
      clear: () => set({ activeHouseholdId: null, households: [] }),
    }),
    { name: "et-household" }
  )
);
