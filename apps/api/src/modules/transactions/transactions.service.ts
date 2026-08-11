import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CreateTransactionInput,
  QueryTransactionsInput,
} from "@expense-tracker/types";
import { CategoriesService } from "../categories/categories.service";
import { HouseholdsRepository } from "../households/households.repository";
import { TransactionsRepository } from "./transactions.repository";
import type {
  TransactionListResult,
  TransactionView,
} from "./interfaces/transaction.interface";
import { Transaction } from "./entities/transaction.entity";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly categories: CategoriesService,
    private readonly households: HouseholdsRepository
  ) {}

  /**
   * FR-TXN-001 / FR-TXN-004 / FR-TXN-006 — create with required category (Phase 0).
   * No AI classification in this phase.
   */
  async create(
    householdId: string,
    auth0Sub: string,
    input: CreateTransactionInput
  ): Promise<TransactionView> {
    const user = await this.households.findUserByAuth0Sub(auth0Sub);
    if (!user) {
      throw new NotFoundException(
        "User not found — complete registration bootstrap first"
      );
    }

    const category = await this.categories.getById(
      householdId,
      input.categoryId
    );
    if (!category.isActive) {
      throw new BadRequestException("Category is inactive");
    }
    if (category.type !== input.type) {
      throw new BadRequestException(
        `Category type ${category.type} does not match transaction type ${input.type}`
      );
    }

    const household = await this.households.findHouseholdById(householdId);
    if (!household) {
      throw new NotFoundException("Household not found");
    }

    const amount = normalizeAmount(input.amount);
    const created = await this.repo.createOne({
      householdId,
      categoryId: input.categoryId,
      createdByUserId: user.id,
      txnDate: toDateOnly(input.date),
      type: input.type,
      amount,
      currency: household.baseCurrency,
      description: input.description?.trim() || null,
      payee: input.payee?.trim() || null,
      notes: input.notes?.trim() || null,
      source: input.source ?? "manual",
      aiConfidence: null,
      // Manual category in Phase 0 counts as confirmed (FR-TXN / FR-CAT-006 prep).
      userConfirmedCategory: true,
    });

    return toView(created);
  }

  async getById(
    householdId: string,
    id: string
  ): Promise<TransactionView> {
    const txn = await this.repo.findById(householdId, id);
    if (!txn) {
      throw new NotFoundException("Transaction not found");
    }
    return toView(txn);
  }

  /** FR-TXN-005 — filter/search list with pagination. */
  async list(
    householdId: string,
    query: QueryTransactionsInput
  ): Promise<TransactionListResult> {
    if (
      query.dateFrom &&
      query.dateTo &&
      query.dateFrom.getTime() > query.dateTo.getTime()
    ) {
      throw new BadRequestException("dateFrom must be on or before dateTo");
    }

    const { items, total } = await this.repo.search({
      householdId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      type: query.type,
      categoryId: query.categoryId,
      payee: query.payee,
      q: query.q,
      limit: query.limit,
      offset: query.offset,
    });

    return {
      items: items.map(toView),
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }
}

function toView(txn: Transaction): TransactionView {
  return {
    id: txn.id,
    householdId: txn.householdId,
    categoryId: txn.categoryId,
    createdByUserId: txn.createdByUserId,
    date: normalizeDateField(txn.txnDate),
    type: txn.type,
    amount: normalizeAmount(String(txn.amount)),
    currency: txn.currency,
    description: txn.description,
    payee: txn.payee,
    notes: txn.notes,
    source: txn.source,
    aiConfidence: txn.aiConfidence,
    userConfirmedCategory: txn.userConfirmedCategory,
    createdAt: txn.createdAt,
  };
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function normalizeDateField(value: string | Date): string {
  if (value instanceof Date) return toDateOnly(value);
  return value.slice(0, 10);
}

/** Keep money as a 2-decimal string — never promote to binary float ops. */
function normalizeAmount(amount: string): string {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
    throw new BadRequestException("Invalid amount format");
  }
  const [whole, frac = ""] = amount.split(".");
  return `${whole}.${frac.padEnd(2, "0")}`;
}
