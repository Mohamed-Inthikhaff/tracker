import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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

  /** Sum of amounts for household + month (helpers for Phase 0 exit checks). */
  async sumByHouseholdAndMonth(
    householdId: string,
    start: Date,
    end: Date
  ): Promise<string> {
    const row = await this.repo
      .createQueryBuilder("t")
      .select("COALESCE(SUM(t.amount), 0)", "total")
      .where("t.household_id = :householdId", { householdId })
      .andWhere("t.txn_date >= :start", { start: toDateOnly(start) })
      .andWhere("t.txn_date < :end", { end: toDateOnly(end) })
      .getRawOne<{ total: string }>();

    return normalizeMoney(row?.total ?? "0");
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
