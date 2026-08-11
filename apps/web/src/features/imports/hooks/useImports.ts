"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importsApi } from "../api/imports.api";
import { useHouseholdStore } from "@/stores/use-household-store";

export function useUploadImport() {
  return useMutation({
    mutationFn: ({ csv, filename }: { csv: string; filename?: string }) =>
      importsApi.uploadCsv(csv, filename),
  });
}

export function usePreviewImport(id: string | null) {
  return useMutation({
    mutationFn: (body: Parameters<typeof importsApi.preview>[1]) => {
      if (!id) throw new Error("Import id required");
      return importsApi.preview(id, body);
    },
  });
}

export function useCommitImport(id: string | null) {
  const queryClient = useQueryClient();
  const householdId = useHouseholdStore((s) => s.activeHouseholdId);

  return useMutation({
    mutationFn: (body: Parameters<typeof importsApi.commit>[1]) => {
      if (!id) throw new Error("Import id required");
      return importsApi.commit(id, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["transactions", householdId],
      });
    },
  });
}
