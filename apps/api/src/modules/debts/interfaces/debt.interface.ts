import type {
  DebtDirection,
  DebtStatus,
} from "@expense-tracker/types";

export interface DebtView {
  id: string;
  householdId: string;
  personName: string;
  direction: DebtDirection;
  /** Decimal string principal (never float). */
  principalAmount: string;
  openedDate: string;
  notes: string | null;
  /** Inclusive window start (same as openedDate). */
  windowStart: string;
  /** Exclusive end — next same person+direction open, or null if current. */
  windowEndExclusive: string | null;
  repaidSoFar: string;
  remaining: string;
  status: DebtStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DebtHouseholdTotals {
  /** Remaining on IOwe debts (FR-DEBT-007). */
  totalOwedByHousehold: string;
  /** Remaining on OwedToMe debts. */
  totalOwedToHousehold: string;
  debts: DebtView[];
}

export interface CreateDebtData {
  householdId: string;
  personName: string;
  direction: DebtDirection;
  principalAmount: string;
  openedDate: string;
  notes: string | null;
}

export interface UpdateDebtData {
  personName?: string;
  principalAmount?: string;
  notes?: string | null;
}
