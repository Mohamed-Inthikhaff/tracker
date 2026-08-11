import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CreateDebtInput,
  DebtDirection,
  UpdateDebtInput,
} from "@expense-tracker/types";
import { TransactionsRepository } from "../transactions/transactions.repository";
import { DebtsRepository } from "./debts.repository";
import {
  addMoney,
  balanceFromAmounts,
  repaymentTypeForDirection,
} from "./debt-window.util";
import type {
  DebtHouseholdTotals,
  DebtView,
} from "./interfaces/debt.interface";
import { Debt } from "./entities/debt.entity";

@Injectable()
export class DebtsService {
  constructor(
    private readonly repo: DebtsRepository,
    private readonly transactions: TransactionsRepository
  ) {}

  /** FR-DEBT-001 / FR-DEBT-004 / FR-DEBT-006 — create ledger entry. */
  async create(
    householdId: string,
    input: CreateDebtInput
  ): Promise<DebtView> {
    const personName = input.personName.trim();
    const created = await this.repo.createOne({
      householdId,
      personName,
      direction: input.direction,
      principalAmount: normalizeAmount(input.principalAmount),
      openedDate: toDateOnly(input.openedDate),
      notes: input.notes?.trim() || null,
    });
    // Opening a new debt automatically closes prior window via date-boundary
    // computation on read (FR-DEBT-004) — no mutation of older rows needed.
    return this.toEnrichedView(created);
  }

  async getById(householdId: string, id: string): Promise<DebtView> {
    const debt = await this.repo.findById(householdId, id);
    if (!debt) throw new NotFoundException("Debt not found");
    return this.toEnrichedView(debt);
  }

  /** FR-DEBT-007 — list with running balances + household aggregates. */
  async listWithTotals(householdId: string): Promise<DebtHouseholdTotals> {
    const rows = await this.repo.listByHousehold(householdId);
    const debts = await Promise.all(rows.map((d) => this.toEnrichedView(d)));

    let totalOwedByHousehold = "0.00";
    let totalOwedToHousehold = "0.00";
    for (const d of debts) {
      if (d.direction === "IOwe") {
        totalOwedByHousehold = addMoney(totalOwedByHousehold, d.remaining);
      } else {
        totalOwedToHousehold = addMoney(totalOwedToHousehold, d.remaining);
      }
    }
    return { totalOwedByHousehold, totalOwedToHousehold, debts };
  }

  async update(
    householdId: string,
    id: string,
    input: UpdateDebtInput
  ): Promise<DebtView> {
    const debt = await this.repo.findById(householdId, id);
    if (!debt) throw new NotFoundException("Debt not found");

    const updated = await this.repo.updateOne(debt, {
      personName:
        input.personName !== undefined ? input.personName.trim() : undefined,
      principalAmount:
        input.principalAmount !== undefined
          ? normalizeAmount(input.principalAmount)
          : undefined,
      notes:
        input.notes === undefined
          ? undefined
          : input.notes === null
            ? null
            : input.notes.trim() || null,
    });
    return this.toEnrichedView(updated);
  }

  /**
   * FR-DEBT-002–005 — compute window peers, sum repayments, derive status.
   */
  private async toEnrichedView(debt: Debt): Promise<DebtView> {
    const series = await this.repo.findSeries(
      debt.householdId,
      debt.personName,
      debt.direction
    );
    const idx = series.findIndex((d) => d.id === debt.id);
    const windowStart = debt.openedDate;
    const next = idx >= 0 ? series[idx + 1] : undefined;
    const windowEndExclusive = next?.openedDate ?? null;

    const repaidSoFar = await this.sumRepaid(
      debt.householdId,
      debt.personName,
      debt.direction,
      windowStart,
      windowEndExclusive
    );
    const { repaidSoFar: repaid, remaining, status } = balanceFromAmounts(
      normalizeAmount(debt.principalAmount),
      repaidSoFar
    );

    return {
      id: debt.id,
      householdId: debt.householdId,
      personName: debt.personName,
      direction: debt.direction,
      principalAmount: normalizeAmount(debt.principalAmount),
      openedDate: debt.openedDate,
      notes: debt.notes,
      windowStart,
      windowEndExclusive,
      repaidSoFar: repaid,
      remaining,
      status,
      createdAt: debt.createdAt,
      updatedAt: debt.updatedAt,
    };
  }

  private sumRepaid(
    householdId: string,
    personName: string,
    direction: DebtDirection,
    windowStart: string,
    windowEndExclusive: string | null
  ): Promise<string> {
    return this.transactions.sumAmountByPayeeTypeAndWindow({
      householdId,
      payee: personName,
      type: repaymentTypeForDirection(direction),
      dateFromInclusive: windowStart,
      dateToExclusive: windowEndExclusive,
    });
  }
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function normalizeAmount(value: string): string {
  return Number(value).toFixed(2);
}
