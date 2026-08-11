"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@/lib/query-client";
import { configureApiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/use-auth-store";
import { useHouseholdStore } from "@/stores/use-household-store";

configureApiClient({
  getToken: () => useAuthStore.getState().accessToken,
  getHouseholdId: () => useHouseholdStore.getState().activeHouseholdId,
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
