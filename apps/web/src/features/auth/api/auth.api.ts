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

export interface AcceptInviteResult {
  id: string;
  name: string;
  baseCurrency: string;
  role: string;
}

export const authApi = {
  bootstrap: (body: {
    email: string;
    displayName?: string;
    householdName?: string;
    baseCurrency?: string;
  }) =>
    apiClient.post<BootstrapResult>("/households/bootstrap", body, {
      skipHousehold: true,
    }),

  acceptInvite: (token: string) =>
    apiClient.post<AcceptInviteResult>(
      "/households/invites/accept",
      { token },
      { skipHousehold: true }
    ),
};
