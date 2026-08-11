import type {
  CategoryRemap,
  ColumnMapping,
  ImportField,
} from "@expense-tracker/types";

export interface UploadImportResult {
  id: string;
  filename: string | null;
  headers: string[];
  rowCount: number;
  suggestedMapping: ColumnMapping;
  status: string;
}

export interface PreviewImportResult {
  id: string;
  status: string;
  readyCount: number;
  failedCount: number;
  unmappedCategories: Array<{
    sourceName: string;
    type: string;
    rowCount: number;
  }>;
  sampleReady: Array<{
    rowNumber: number;
    date: string;
    type: string;
    categoryName: string;
    amount: string;
    description: string | null;
    payee: string | null;
  }>;
  failed: Array<{ rowNumber: number; reason: string }>;
  canCommit: boolean;
}

export interface CommitImportResult {
  id: string;
  status: "committed";
  createdCount: number;
  source: "csv_import";
  transactionIds: string[];
}

export type { CategoryRemap, ColumnMapping, ImportField };
