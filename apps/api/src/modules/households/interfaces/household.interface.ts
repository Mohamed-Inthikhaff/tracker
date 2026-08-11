import type { HouseholdRole } from "@expense-tracker/types";

export interface HouseholdSummary {
  id: string;
  name: string;
  baseCurrency: string;
  role: HouseholdRole;
  createdAt: Date;
}

export interface MemberSummary {
  userId: string;
  email: string;
  displayName: string;
  role: HouseholdRole;
  joinedAt: Date;
}

export interface InviteSummary {
  id: string;
  email: string;
  role: HouseholdRole;
  token: string;
  status: string;
  expiresAt: Date;
}

export interface BootstrapResult {
  userId: string;
  household: HouseholdSummary;
  created: boolean;
}
