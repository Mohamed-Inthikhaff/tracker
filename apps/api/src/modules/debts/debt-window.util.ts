import type { DebtDirection, DebtStatus } from "@expense-tracker/types";
import type { TransactionType } from "@expense-tracker/types";

/**
 * Pure date-window + balance helpers for FR-DEBT-002–005.
 *
 * Spreadsheet model: for each debt (person + direction), the active window is
 * [openedDate, nextSamePersonDirectionOpenedDate). Matching repayments in that
 * window (payee = person, type by direction) sum to "repaid so far".
 *
 * Direction → repayment transaction type:
 * - IOwe: household pays creditor → DebtGiven (money out) — "Debt Repayment"
 * - OwedToMe: debtor pays household → DebtReceived (money in)
 *
 * Opening principal lives on the debt row only; duplicate opening txns should not
 * use the repayment type + same payee in-window or they inflate repaid.
 */
export function repaymentTypeForDirection(
  direction: DebtDirection
): TransactionType {
  return direction === "IOwe" ? "DebtGiven" : "DebtReceived";
}

/**
 * Inclusive start, exclusive end (next open date or null = open-ended).
 * Dates are YYYY-MM-DD.
 */
export function isTxnInDebtWindow(
  txnDate: string,
  windowStart: string,
  windowEndExclusiveDate: string | null
): boolean {
  if (txnDate < windowStart) return false;
  if (
    windowEndExclusiveDate !== null &&
    txnDate >= windowEndExclusiveDate
  ) {
    return false;
  }
  return true;
}

export function normalizePersonName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export function comparePersonKey(a: string, b: string): boolean {
  return normalizePersonName(a) === normalizePersonName(b);
}

/** FR-DEBT-003 / FR-DEBT-005 — remaining + status from principal vs repaid. */
export function balanceFromAmounts(
  principal: string,
  repaid: string
): {
  repaidSoFar: string;
  remaining: string;
  status: DebtStatus;
} {
  const p = parseMoney(principal);
  const r = parseMoney(repaid);
  const remainingCents = Math.max(0, p - r);
  let status: DebtStatus;
  if (remainingCents <= 0) status = "Settled";
  else if (r <= 0) status = "Outstanding";
  else status = "PartiallyPaid";
  return {
    repaidSoFar: fromCents(r),
    remaining: fromCents(remainingCents),
    status,
  };
}

export function addMoney(a: string, b: string): string {
  return fromCents(parseMoney(a) + parseMoney(b));
}

function parseMoney(value: string): number {
  const n = Math.round(Number(value) * 100);
  if (!Number.isFinite(n)) return 0;
  return n;
}

function fromCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
