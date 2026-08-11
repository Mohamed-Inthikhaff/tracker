"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  sub: string;
  email: string;
  displayName?: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (token: string, user: AuthUser) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
    }),
    { name: "et-auth" }
  )
);
