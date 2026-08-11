/**
 * Minimal RFC4180-ish CSV parser (header + rows as string cells).
 * Handles quoted fields, commas, and CRLF/LF.
 */
export function parseCsv(text: string): {
  headers: string[];
  rows: string[][];
} {
  const rows = parseCsvRows(text);
  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }
  const headers = rows[0]!.map((h) => h.trim());
  const body = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim().length > 0));
  return { headers, rows: body };
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = "";
  };
  const pushRow = () => {
    // drop pure trailing empty row
    if (row.length === 1 && row[0] === "" && rows.length > 0) {
      row = [];
      return;
    }
    rows.push(row);
    row = [];
  };

  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!;
    const next = input[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      pushCell();
    } else if (ch === "\n") {
      pushCell();
      pushRow();
    } else if (ch === "\r") {
      // ignore; handle \r\n via \n
    } else {
      cell += ch;
    }
  }
  pushCell();
  if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
    pushRow();
  }
  return rows;
}

/** Suggested column mapping for the Expense Tracker spreadsheet CSV export. */
export function suggestColumnMapping(
  headers: string[]
): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const header of headers) {
    const key = header.trim().toLowerCase();
    if (!key) {
      mapping[header] = "skip";
      continue;
    }
    if (key === "date" || key.includes("txn date") || key === "txn_date") {
      mapping[header] = "date";
    } else if (key === "type") {
      mapping[header] = "type";
    } else if (key === "category" || key.startsWith("category ")) {
      mapping[header] = "category";
    } else if (
      key.includes("amount") ||
      key === "rs" ||
      key.startsWith("amount ")
    ) {
      mapping[header] = "amount";
    } else if (
      key.includes("payee") ||
      key.includes("person") ||
      key === "merchant"
    ) {
      mapping[header] = "payee";
    } else if (key === "description" || key === "desc" || key === "memo") {
      mapping[header] = "description";
    } else if (key === "notes" || key === "note" || key === "comment") {
      mapping[header] = "notes";
    } else if (key === "day") {
      mapping[header] = "skip";
    } else {
      mapping[header] = "skip";
    }
  }
  return mapping;
}

export function rowsToRecords(
  headers: string[],
  rows: string[][]
): Array<Record<string, string>> {
  return rows.map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = (cells[i] ?? "").trim();
    });
    return record;
  });
}
