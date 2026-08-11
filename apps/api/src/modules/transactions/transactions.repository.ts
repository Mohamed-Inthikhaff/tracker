import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { TransactionType } from "@expense-tracker/types";
import { Transaction } from "./entities/transaction.entity";
import type {
  CreateTransactionData,
  TransactionSearchFilters,
} from "./interfaces/transaction.interface";

/**
 * Only file that talks to TypeORM for transactions (implementation-plan §5.1).
 * Services depend on this class so specs mock without a database.
 */
@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repo: Repository<Transaction>
  ) {}

  createOne(data: CreateTransactionData): Promise<Transaction> {
    return this.repo.save(this.repo.create(data));
  }

  createMany(data: CreateTransactionData[]): Promise<Transaction[]> {
    if (data.length === 0) return Promise.resolve([]);
    return this.repo.save(data.map((row) => this.repo.create(row)));
  }

  findById(
    householdId: string,
    id: string
  ): Promise<Transaction | null> {
    return this.repo.findOne({ where: { id, householdId } });
  }

  async search(
    filters: TransactionSearchFilters
  ): Promise<{ items: Transaction[]; total: number }> {
    const qb = this.repo
      .createQueryBuilder("t")
      .where("t.household_id = :householdId", {
        householdId: filters.householdId,
      });

    if (filters.dateFrom) {
      qb.andWhere("t.txn_date >= :dateFrom", {
        dateFrom: toDateOnly(filters.dateFrom),
      });
    }
    if (filters.dateTo) {
      qb.andWhere("t.txn_date <= :dateTo", {
        dateTo: toDateOnly(filters.dateTo),
      });
    }
    if (filters.type) {
      qb.andWhere("t.type = :type", { type: filters.type });
    }
    if (filters.categoryId) {
      qb.andWhere("t.category_id = :categoryId", {
        categoryId: filters.categoryId,
      });
    }
    if (filters.payee?.trim()) {
      qb.andWhere("t.payee ILIKE :payee", {
        payee: `%${filters.payee.trim()}%`,
      });
    }
    if (filters.q?.trim()) {
      qb.andWhere(
        "(t.description ILIKE :q OR t.payee ILIKE :q OR t.notes ILIKE :q)",
        { q: `%${filters.q.trim()}%` }
      );
    }

    qb.orderBy("t.txn_date", "DESC")
      .addOrderBy("t.created_at", "DESC")
      .skip(filters.offset)
      .take(filters.limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  /** Totals by type for household date range (Phase 0 Dashboard comparison). */
  async sumByType(
    householdId: string,
    start: Date,
    endInclusive: Date
  ): Promise<
    Array<{ type: string; total: string; count: string }>
  > {
    const rows = await this.repo
      .createQueryBuilder("t")
      .select("t.type", "type")
      .addSelect("COALESCE(SUM(t.amount), 0)", "total")
      .addSelect("COUNT(*)", "count")
      .where("t.household_id = :householdId", { householdId })
      .andWhere("t.txn_date >= :start", { start: toDateOnly(start) })
      .andWhere("t.txn_date <= :end", { end: toDateOnly(endInclusive) })
      .groupBy("t.type")
      .getRawMany<{ type: string; total: string; count: string }>();

    return rows.map((r) => ({
      type: r.type,
      total: normalizeMoney(r.total),
      count: String(r.count),
    }));
  }

  async countByHouseholdAndRange(
    householdId: string,
    start: Date,
    endInclusive: Date
  ): Promise<number> {
    return this.repo
      .createQueryBuilder("t")
      .where("t.household_id = :householdId", { householdId })
      .andWhere("t.txn_date >= :start", { start: toDateOnly(start) })
      .andWhere("t.txn_date <= :end", { end: toDateOnly(endInclusive) })
      .getCount();
  }

  /**
   * Sum amounts for debt repayment auto-link (FR-DEBT-002/003).
   * window: [dateFromInclusive, dateToExclusive); open-ended if dateToExclusive null.
   * Payee match is case-insensitive trimmed equality.
   */
  async sumAmountByPayeeTypeAndWindow(opts: {
    householdId: string;
    payee: string;
    type: TransactionType;
    dateFromInclusive: string;
    dateToExclusive: string | null;
  }): Promise<string> {
    const qb = this.repo
      .createQueryBuilder("t")
      .select("COALESCE(SUM(t.amount), 0)", "total")
      .where("t.household_id = :householdId", {
        householdId: opts.householdId,
      })
      .andWhere("t.type = :type", { type: opts.type })
      .andWhere("LOWER(TRIM(t.payee)) = LOWER(TRIM(:payee))", {
        payee: opts.payee,
      })
      .andWhere("t.txn_date >= :from", { from: opts.dateFromInclusive });

    if (opts.dateToExclusive) {
      qb.andWhere("t.txn_date < :toExclusive", {
        toExclusive: opts.dateToExclusive,
      });
    }

    const row = await qb.getRawOne<{ total: string }>();
    return normalizeMoney(row?.total ?? "0");
  }

  /**
   * Expense totals per category for a calendar date range (FR-BUD-002).
   * Always computed from transactions — never stored on budgets.
   */
  async sumExpenseByCategory(opts: {
    householdId: string;
    dateFromInclusive: string;
    dateToInclusive: string;
    categoryIds?: string[];
  }): Promise<Map<string, string>> {
    const qb = this.repo
      .createQueryBuilder("t")
      .select("t.category_id", "categoryId")
      .addSelect("COALESCE(SUM(t.amount), 0)", "total")
      .where("t.household_id = :householdId", {
        householdId: opts.householdId,
      })
      .andWhere("t.type = :type", { type: "Expense" })
      .andWhere("t.txn_date >= :from", { from: opts.dateFromInclusive })
      .andWhere("t.txn_date <= :to", { to: opts.dateToInclusive })
      .groupBy("t.category_id");

    if (opts.categoryIds && opts.categoryIds.length > 0) {
      qb.andWhere("t.category_id IN (:...categoryIds)", {
        categoryIds: opts.categoryIds,
      });
    }

    const rows = await qb.getRawMany<{ categoryId: string; total: string }>();
    const map = new Map<string, string>();
    for (const row of rows) {
      map.set(row.categoryId, normalizeMoney(row.total));
    }
    return map;
  }
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function normalizeMoney(value: string | number): string {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}
