import { apiClient } from "@/lib/api-client";
import type { Category, CategoryType } from "../types/category.types";

export const categoriesApi = {
  list: (params?: { type?: CategoryType; includeInactive?: boolean }) =>
    apiClient.get<Category[]>("/categories", {
      params: {
        type: params?.type,
        includeInactive: params?.includeInactive ? "true" : undefined,
      },
    }),
};
