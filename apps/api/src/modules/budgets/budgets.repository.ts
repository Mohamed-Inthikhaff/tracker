import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Budget } from "./entities/budget.entity";
import type { CreateBudgetData } from "./interfaces/budget.interface";

@Injectable()
export class BudgetsRepository {
  constructor(
    @InjectRepository(Budget)
    private readonly repo: Repository<Budget>
  ) {}

  findByMonth(householdId: string, month: string): Promise<Budget[]> {
    return this.repo.find({
      where: { householdId, month },
      order: { createdAt: "ASC" },
      relations: { category: true },
    });
  }

  findOne(
    householdId: string,
    categoryId: string,
    month: string
  ): Promise<Budget | null> {
    return this.repo.findOne({
      where: { householdId, categoryId, month },
      relations: { category: true },
    });
  }

  async upsert(data: CreateBudgetData): Promise<Budget> {
    const existing = await this.findOne(
      data.householdId,
      data.categoryId,
      data.month
    );
    if (existing) {
      existing.budgetedAmount = data.budgetedAmount;
      return this.repo.save(existing);
    }
    return this.repo.save(this.repo.create(data));
  }

  async insertMany(rows: CreateBudgetData[]): Promise<Budget[]> {
    if (rows.length === 0) return [];
    return this.repo.save(rows.map((r) => this.repo.create(r)));
  }
}
