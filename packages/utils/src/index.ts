/** Current calendar month as YYYY-MM (UTC). */
export function currentMonthKey(d: Date = new Date()): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** Previous N months ending at `endMonth` (inclusive), newest last. */
export function monthKeysBack(count: number, endMonth?: string): string[] {
  const [ey, em] = (endMonth ?? currentMonthKey()).split("-").map(Number);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(ey, em - 1 - i, 1));
    keys.push(
      `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
    );
  }
  return keys;
}

/** Display money that is already a fixed decimal string. */
export function formatMoney(amount: string, currency = ""): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${currency} ${formatted}` : formatted;
}
