import type {
  CategoryRemap,
  ColumnMapping,
  ImportDateFormat,
  TransactionType,
} from "@expense-tracker/types";
import { IMPORT_DATE_FORMAT_LABEL, normalizeDate } from "./import-date";

export interface ParsedImportRow {
  rowNumber: number;
  date: string;
  type: TransactionType;
  categoryName: string;
  amount: string;
  description: string | null;
  payee: string | null;
  notes: string | null;
}

export interface FailedImportRow {
  rowNumber: number;
  reason: string;
  raw: Record<string, string>;
}

export interface ReadyImportRow extends ParsedImportRow {
  categoryId: string;
}

export interface ImportPreviewResult {
  ready: ReadyImportRow[];
  failed: FailedImportRow[];
  unmappedCategories: Array<{
    sourceName: string;
    type: TransactionType;
    rowCount: number;
  }>;
  readyCount: number;
  failedCount: number;
}

interface CategoryLookup {
  id: string;
  name: string;
  type: TransactionType;
  isActive: boolean;
}

/**
 * Map CSV records through column mapping, validate fields, resolve categories
 * (FR-IMP-001–003). Pure function — easy to unit-test without Nest DI.
 */
export function buildImportPreview(
  records: Array<Record<string, string>>,
  mapping: ColumnMapping,
  categories: CategoryLookup[],
  remaps: CategoryRemap[],
  dateFormat: ImportDateFormat
): ImportPreviewResult {
  assertRequiredFields(mapping);

  const remapKey = (name: string, type: TransactionType) =>
    `${type}::${name.trim().toLowerCase()}`;

  const remapIndex = new Map(
    remaps.map((r) => [remapKey(r.sourceName, r.type), r])
  );

  const categoryByNameType = new Map(
    categories
      .filter((c) => c.isActive)
      .map((c) => [remapKey(c.name, c.type), c])
  );

  const ready: ReadyImportRow[] = [];
  const failed: FailedImportRow[] = [];
  const unmappedCount = new Map<string, { sourceName: string; type: TransactionType; rowCount: number }>();

  records.forEach((raw, index) => {
    const rowNumber = index + 2; // header is row 1
    const extracted = extractFields(raw, mapping);
    if ("error" in extracted) {
      failed.push({ rowNumber, reason: extracted.error, raw });
      return;
    }

    const type = normalizeType(extracted.type);
    if (!type) {
      failed.push({
        rowNumber,
        reason: `Unrecognized type "${extracted.type}"`,
        raw,
      });
      return;
    }

    const date = normalizeDate(extracted.date, dateFormat);
    if (!date) {
      failed.push({
        rowNumber,
        reason: `Invalid date "${extracted.date}" for ${IMPORT_DATE_FORMAT_LABEL[dateFormat]}`,
        raw,
      });
      return;
    }

    const amount = normalizeAmount(extracted.amount);
    if (!amount) {
      failed.push({
        rowNumber,
        reason: `Invalid amount "${extracted.amount}"`,
        raw,
      });
      return;
    }

    const categoryName = extracted.category.trim();
    if (!categoryName) {
      failed.push({ rowNumber, reason: "Category is required", raw });
      return;
    }

    const remap = remapIndex.get(remapKey(categoryName, type));
    let categoryId: string | undefined;

    if (remap?.targetCategoryId) {
      const target = categories.find((c) => c.id === remap.targetCategoryId);
      if (!target || !target.isActive) {
        failed.push({
          rowNumber,
          reason: `Remap target category not found for "${categoryName}"`,
          raw,
        });
        return;
      }
      if (target.type !== type) {
        failed.push({
          rowNumber,
          reason: `Remap category type mismatch for "${categoryName}"`,
          raw,
        });
        return;
      }
      categoryId = target.id;
    } else if (remap?.createCategory) {
      // Resolved later by service before final resolve; treat as still pending
      // unless already created and present in categories list under new name.
      const newName = (remap.newCategoryName ?? remap.sourceName).trim();
      const created = categoryByNameType.get(remapKey(newName, type));
      if (created) {
        categoryId = created.id;
      } else {
        const key = remapKey(categoryName, type);
        const entry = unmappedCount.get(key) ?? {
          sourceName: categoryName,
          type,
          rowCount: 0,
        };
        entry.rowCount += 1;
        unmappedCount.set(key, entry);
        failed.push({
          rowNumber,
          reason: `Category pending create: "${categoryName}"`,
          raw,
        });
        return;
      }
    } else {
      const match = categoryByNameType.get(remapKey(categoryName, type));
      if (!match) {
        const key = remapKey(categoryName, type);
        const entry = unmappedCount.get(key) ?? {
          sourceName: categoryName,
          type,
          rowCount: 0,
        };
        entry.rowCount += 1;
        unmappedCount.set(key, entry);
        failed.push({
          rowNumber,
          reason: `Unmapped category "${categoryName}" (${type})`,
          raw,
        });
        return;
      }
      categoryId = match.id;
    }

    ready.push({
      rowNumber,
      date,
      type,
      categoryName,
      categoryId: categoryId!,
      amount,
      description: extracted.description || null,
      payee: extracted.payee || null,
      notes: extracted.notes || null,
    });
  });

  return {
    ready,
    failed,
    unmappedCategories: [...unmappedCount.values()],
    readyCount: ready.length,
    failedCount: failed.length,
  };
}

function assertRequiredFields(mapping: ColumnMapping): void {
  const fields = new Set(Object.values(mapping));
  for (const required of ["date", "type", "category", "amount"] as const) {
    if (!fields.has(required)) {
      throw new Error(`Column mapping must include a "${required}" field`);
    }
  }
}

function extractFields(
  raw: Record<string, string>,
  mapping: ColumnMapping
):
  | {
      date: string;
      type: string;
      category: string;
      amount: string;
      description: string;
      payee: string;
      notes: string;
    }
  | { error: string } {
  const get = (field: string) => {
    const header = Object.entries(mapping).find(([, f]) => f === field)?.[0];
    return header ? (raw[header] ?? "").trim() : "";
  };
  return {
    date: get("date"),
    type: get("type"),
    category: get("category"),
    amount: get("amount"),
    description: get("description"),
    payee: get("payee"),
    notes: get("notes"),
  };
}

function normalizeType(raw: string): TransactionType | null {
  const t = raw.trim();
  const aliases: Record<string, TransactionType> = {
    income: "Income",
    expense: "Expense",
    saving: "Saving",
    savings: "Saving",
    debtgiven: "DebtGiven",
    "debt given": "DebtGiven",
    debt_given: "DebtGiven",
    debtreceived: "DebtReceived",
    "debt received": "DebtReceived",
    debt_received: "DebtReceived",
  };
  if (
    t === "Income" ||
    t === "Expense" ||
    t === "Saving" ||
    t === "DebtGiven" ||
    t === "DebtReceived"
  ) {
    return t;
  }
  return aliases[t.toLowerCase()] ?? null;
}

export function normalizeAmount(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  s = s.replace(/,/g, "").replace(/^[A-Za-z₹$€£]+\s*/, "").replace(/\s*[A-Za-z]+$/, "");
  // parentheses for negatives not allowed (amount must be positive)
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(s)) {
    const n = Number(s);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n.toFixed(2);
  }
  if (Number(s) <= 0) return null;
  const [whole, frac = ""] = s.split(".");
  return `${whole}.${frac.padEnd(2, "0")}`;
}
