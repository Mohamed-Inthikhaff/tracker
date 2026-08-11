import { apiClient } from "@/lib/api-client";
import type { HouseholdOption } from "@/stores/use-household-store";

export const householdsApi = {
  listMine: () =>
    apiClient.get<HouseholdOption[]>("/households", { skipHousehold: true }),
};
