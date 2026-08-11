import type {
  CategoryRemap,
  ColumnMapping,
  TransactionType,
} from "@expense-tracker/types";
import type {
  FailedImportRow,
  ReadyImportRow,
} from "../import-preview.builder";

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
    type: TransactionType;
    rowCount: number;
  }>;
  /** First N ready rows for UI review (FR-IMP-003). */
  sampleReady: ReadyImportRow[];
  /** Failed rows including parse errors and unmapped categories. */
  failed: FailedImportRow[];
  canCommit: boolean;
}

export interface CommitImportResult {
  id: string;
  status: "committed";
  createdCount: number;
  source: "csv_import";
  transactionIds: string[];
}

export type { CategoryRemap, ColumnMapping };
