import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CreateTransactionInput,
  MonthlySummaryQuery,
  QueryTransactionsInput,
  TransactionType,
} from "@expense-tracker/types";
import { CategoriesService } from "../categories/categories.service";
import { ClassificationService } from "../classification/classification.service";
import { BillingService } from "../billing/billing.service";
import { HouseholdsRepository } from "../households/households.repository";
import { TransactionsRepository } from "./transactions.repository";
import type {
  MonthlyTotalsSummary,
  TransactionListResult,
  TransactionView,
} from "./interfaces/transaction.interface";
import { Transaction } from "./entities/transaction.entity";

@Injectable()
export class TransactionsService {
  constructor(
    private readonly repo: TransactionsRepository,
    private readonly categories: CategoriesService,
    private readonly households: HouseholdsRepository,
    private readonly classification: ClassificationService,
    private readonly billing: BillingService
  ) {}

  /**
   * FR-TXN-001 + FR-CAT-003 + FR-BILL-007 — create with free-tier enforcement.
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

    const household = await this.households.findHouseholdById(householdId);
    if (!household) {
      throw new NotFoundException("Household not found");
    }

    await this.billing.assertCanCreateTransaction(householdId);

    let categoryId = input.categoryId ?? null;
    let aiConfidence: string | null = null;
    const userProvidedCategory = Boolean(categoryId);

    if (!categoryId && input.description?.trim()) {
      const suggestion = await this.classification.suggestCategory(
        householdId,
        input.description,
        input.type
      );
      categoryId = suggestion.categoryId;
      aiConfidence = suggestion.confidence.toFixed(3);
    }

    if (!categoryId) {
      throw new BadRequestException(
        "categoryId is required when description is missing (no AI suggestion possible)"
      );
    }

    const category = await this.categories.getById(householdId, categoryId);
    if (!category.isActive) {
      throw new BadRequestException("Category is inactive");
    }
    if (category.type !== input.type) {
      throw new BadRequestException(
        `Category type ${category.type} does not match transaction type ${input.type}`
      );
    }

    const amount = normalizeAmount(input.amount);
    const created = await this.repo.createOne({
      householdId,
      categoryId,
      createdByUserId: user.id,
      txnDate: toDateOnly(input.date),
      type: input.type,
      amount,
      currency: household.baseCurrency,
      description: input.description?.trim() || null,
      payee: input.payee?.trim() || null,
      notes: input.notes?.trim() || null,
      source: input.source ?? "manual",
      aiConfidence,
      userConfirmedCategory: userProvidedCategory,
    });

    if (userProvidedCategory && input.description?.trim()) {
      await this.classification.recordFeedback(householdId, {
        description: input.description,
        categoryId,
        accepted: true,
      });
    }

    return toView(created);
  }

  async getById(householdId: string, id: string): Promise<TransactionView> {
    const txn = await this.repo.findById(householdId, id);
    if (!txn) {
      throw new NotFoundException("Transaction not found");
    }
    return toView(txn);
  }

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

  async monthlySummary(
    householdId: string,
    query: MonthlySummaryQuery
  ): Promise<MonthlyTotalsSummary> {
    const { start, end, month } = resolveSummaryRange(query);
    const rows = await this.repo.sumByType(householdId, start, end);
    const count = await this.repo.countByHouseholdAndRange(
      householdId,
      start,
      end
    );

    const byType: MonthlyTotalsSummary["byType"] = {
      Income: "0.00",
      Expense: "0.00",
      Saving: "0.00",
      DebtGiven: "0.00",
      DebtReceived: "0.00",
    };

    for (const row of rows) {
      if (row.type in byType) {
        byType[row.type as TransactionType] = row.total;
      }
    }

    return {
      dateFrom: toDateOnly(start),
      dateTo: toDateOnly(end),
      month,
      count,
      byType,
      netBalance: subtractMoney(byType.Income, byType.Expense),
    };
  }
}

function resolveSummaryRange(query: MonthlySummaryQuery): {
  start: Date;
  end: Date;
  month: string | null;
} {
  if (query.month) {
    const [y, m] = query.month.split("-").map(Number);
    if (!y || !m || m < 1 || m > 12) {
      throw new BadRequestException("Invalid month");
    }
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 0));
    return { start, end, month: query.month };
  }

  if (query.dateFrom && query.dateTo) {
    if (query.dateFrom.getTime() > query.dateTo.getTime()) {
      throw new BadRequestException("dateFrom must be on or before dateTo");
    }
    return {
      start: query.dateFrom,
      end: query.dateTo,
      month: null,
    };
  }

  const now = new Date();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth() + 1;
  const month = `${y}-${String(m).padStart(2, "0")}`;
  return resolveSummaryRange({ month });
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

function normalizeAmount(amount: string): string {
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) {
    throw new BadRequestException("Invalid amount format");
  }
  const [whole, frac = ""] = amount.split(".");
  return `${whole}.${frac.padEnd(2, "0")}`;
}

function subtractMoney(a: string, b: string): string {
  const cents = (s: string) => {
    const [w, f = "00"] = s.split(".");
    return Number(w) * 100 + Number((f + "00").slice(0, 2));
  };
  const diff = cents(a) - cents(b);
  const sign = diff < 0 ? "-" : "";
  const abs = Math.abs(diff);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${frac}`;
}
