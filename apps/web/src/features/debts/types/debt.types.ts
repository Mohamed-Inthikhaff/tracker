export type DebtDirection = "IOwe" | "OwedToMe";
export type DebtStatus = "Outstanding" | "PartiallyPaid" | "Settled";

export interface Debt {
  id: string;
  householdId: string;
  personName: string;
  direction: DebtDirection;
  principalAmount: string;
  openedDate: string;
  notes: string | null;
  windowStart: string;
  windowEndExclusive: string | null;
  repaidSoFar: string;
  remaining: string;
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
}

export interface DebtHouseholdTotals {
  totalOwedByHousehold: string;
  totalOwedToHousehold: string;
  debts: Debt[];
}

export interface CreateDebtInput {
  personName: string;
  direction: DebtDirection;
  principalAmount: string;
  openedDate: Date | string;
  notes?: string;
}
