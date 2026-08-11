import { apiClient } from "@/lib/api-client";
import type {
  CategoryRemap,
  ColumnMapping,
  CommitImportResult,
  PreviewImportResult,
  UploadImportResult,
} from "../types/import.types";

export const importsApi = {
  uploadCsv: async (csv: string, filename?: string) =>
    apiClient.post<UploadImportResult>("/imports", { csv, filename }),

  uploadFile: async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiClient.post<UploadImportResult>("/imports", undefined, {
      formData: form,
    });
  },

  get: (id: string) => apiClient.get<UploadImportResult>(`/imports/${id}`),

  preview: (
    id: string,
    body: { mapping: ColumnMapping; categoryRemaps?: CategoryRemap[] }
  ) => apiClient.post<PreviewImportResult>(`/imports/${id}/preview`, body),

  commit: (
    id: string,
    body: { mapping: ColumnMapping; categoryRemaps?: CategoryRemap[] }
  ) => apiClient.post<CommitImportResult>(`/imports/${id}/commit`, body),
};
