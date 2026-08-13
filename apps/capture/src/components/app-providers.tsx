"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { createQueryClient } from "@/lib/query-client";
import { configureApiClient } from "@/lib/api-client";
import { useAuthStore } from "@/stores/use-auth-store";
import { useHouseholdStore } from "@/stores/use-household-store";
import { Auth0SessionBridge } from "@/features/auth/components/Auth0SessionBridge";

configureApiClient({
  getToken: () => useAuthStore.getState().accessToken,
  getHouseholdId: () => useHouseholdStore.getState().activeHouseholdId,
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());
  return (
    <Auth0Provider>
      <QueryClientProvider client={queryClient}>
        <Auth0SessionBridge />
        {children}
      </QueryClientProvider>
    </Auth0Provider>
  );
}
