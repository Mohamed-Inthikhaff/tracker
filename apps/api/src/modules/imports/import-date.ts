import type { ColumnMapping, ImportDateFormat } from "@expense-tracker/types";

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/;
const SLASH = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/;
const EXCEL_SERIAL = /^\d{5}(\.\d+)?$/;

export const IMPORT_DATE_FORMAT_LABEL: Record<ImportDateFormat, string> = {
  iso: "YYYY-MM-DD (ISO)",
  dmy: "DD/MM/YYYY",
  mdy: "MM/DD/YYYY",
};

/**
 * Guess a single format that is consistent across sample strings.
 * Returns null when slash dates are still ambiguous (both parts ≤ 12)
 * or when ISO and slash styles are mixed — caller must ask the user.
 */
export function suggestDateFormat(rawDates: string[]): ImportDateFormat | null {
  let iso = 0;
  let slash = 0;
  let serial = 0;
  let firstGt12 = false;
  let secondGt12 = false;

  for (const raw of rawDates) {
    const s = raw.trim();
    if (!s) continue;
    if (EXCEL_SERIAL.test(s)) {
      serial += 1;
      continue;
    }
    if (ISO.test(s)) {
      iso += 1;
      continue;
    }
    const m = s.match(SLASH);
    if (!m) continue;
    slash += 1;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a > 12) firstGt12 = true;
    if (b > 12) secondGt12 = true;
  }

  if (slash === 0) return iso > 0 || serial > 0 ? "iso" : null;
  if (iso > 0) return null;
  if (firstGt12 && !secondGt12) return "dmy";
  if (secondGt12 && !firstGt12) return "mdy";
  return null;
}

/** First unique non-empty values from the mapped date column. */
export function collectDateSamples(
  records: Array<Record<string, string>>,
  mapping: ColumnMapping,
  limit = 12
): string[] {
  const header = Object.entries(mapping).find(([, field]) => field === "date")?.[0];
  if (!header) return [];
  const seen = new Set<string>();
  const samples: string[] = [];
  for (const row of records) {
    const value = (row[header] ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    samples.push(value);
    if (samples.length >= limit) break;
  }
  return samples;
}

/**
 * Parse one date string with a confirmed format. Invalid calendar dates
 * (e.g. day 13 under MDY) return null — preview marks the row failed.
 * Excel serials are unambiguous and accepted under every format.
 */
export function normalizeDate(
  raw: string,
  format: ImportDateFormat
): string | null {
  const s = raw.trim();
  if (!s) return null;

  if (EXCEL_SERIAL.test(s)) {
    const serial = Math.floor(Number(s));
    const excelEpoch = Date.UTC(1899, 11, 30);
    const ms = excelEpoch + serial * 24 * 60 * 60 * 1000;
    return new Date(ms).toISOString().slice(0, 10);
  }

  if (format === "iso") {
    const m = s.match(ISO);
    if (!m) return null;
    return validYmd(Number(m[1]), Number(m[2]), Number(m[3]));
  }

  const m = s.match(SLASH);
  if (!m) return null;
  const a = Number(m[1]);
  const b = Number(m[2]);
  const year = Number(m[3]);
  if (format === "dmy") return validYmd(year, b, a);
  return validYmd(year, a, b);
}

function validYmd(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (
    dt.getUTCFullYear() !== year ||
    dt.getUTCMonth() !== month - 1 ||
    dt.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
