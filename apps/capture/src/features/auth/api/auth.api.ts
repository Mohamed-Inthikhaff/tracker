import { apiClient } from "@/lib/api-client";

export interface BootstrapResult {
  userId: string;
  household: {
    id: string;
    name: string;
    baseCurrency: string;
    role: string;
    createdAt: string;
  };
  created: boolean;
}

export const authApi = {
  bootstrap: (body: {
    email: string;
    displayName?: string;
    householdName?: string;
    baseCurrency?: string;
  }) => apiClient.post<BootstrapResult>("/households/bootstrap", body),
};
