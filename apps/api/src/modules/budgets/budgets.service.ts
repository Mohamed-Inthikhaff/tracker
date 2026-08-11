import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CopyBudgetMonthInput,
  SetBudgetInput,
} from "@expense-tracker/types";
import { CategoriesService } from "../categories/categories.service";
import { TransactionsRepository } from "../transactions/transactions.repository";
import { BudgetsRepository } from "./budgets.repository";
import {
  addMoney,
  computeBudgetLine,
  computeSavingsRates,
  monthRange,
} from "./budget-math.util";
import type {
  BudgetLineView,
  BudgetMonthSummary,
} from "./interfaces/budget.interface";
import { Budget } from "./entities/budget.entity";

@Injectable()
export class BudgetsService {
  constructor(
    private readonly repo: BudgetsRepository,
    private readonly categories: CategoriesService,
    private readonly transactions: TransactionsRepository
  ) {}

  /** FR-BUD-001 — set/upsert amount for category+month. */
  async set(
    householdId: string,
    input: SetBudgetInput
  ): Promise<BudgetLineView> {
    const category = await this.categories.getById(
      householdId,
      input.categoryId
    );
    if (category.type !== "Expense") {
      throw new BadRequestException(
        "Budgets apply to Expense categories only"
      );
    }
    if (!category.isActive) {
      throw new BadRequestException("Category is inactive");
    }

    const saved = await this.repo.upsert({
      householdId,
      categoryId: input.categoryId,
      month: input.month,
      budgetedAmount: normalizeAmount(input.budgetedAmount),
    });
    // Attach name for view
    saved.category = { name: category.name } as Budget["category"];
    return this.enrichLine(householdId, saved);
  }

  /**
   * FR-BUD-002–005 — month overview with live actuals + savings rates.
   * Actual is always recomputed from transactions (not stored).
   */
  async getMonth(
    householdId: string,
    month: string
  ): Promise<BudgetMonthSummary> {
    assertMonth(month);
    const { start, endInclusive } = monthRange(month);
    const budgets = await this.repo.findByMonth(householdId, month);
    const actualMap = await this.transactions.sumExpenseByCategory({
      householdId,
      dateFromInclusive: start,
      dateToInclusive: endInclusive,
    });
    const income = await this.transactions.sumByType(
      householdId,
      new Date(`${start}T00:00:00.000Z`),
      new Date(`${endInclusive}T00:00:00.000Z`)
    );
    const totalIncome =
      income.find((r) => r.type === "Income")?.total ?? "0.00";

    const lines = budgets.map((b) =>
      this.lineFromBudget(b, actualMap.get(b.categoryId) ?? "0.00")
    );

    let totalBudgeted = "0.00";
    let totalActual = "0.00";
    for (const line of lines) {
      totalBudgeted = addMoney(totalBudgeted, line.budgetedAmount);
      totalActual = addMoney(totalActual, line.actualAmount);
    }

    // Unbudgeted expense categories still count toward actual total for savings
    // rate vs actual household expense — use full Expense sum if higher.
    const expenseTotal =
      income.find((r) => r.type === "Expense")?.total ?? "0.00";
    const actualExpenseForRate =
      parseFloat(expenseTotal) > parseFloat(totalActual)
        ? expenseTotal
        : totalActual;

    const rates = computeSavingsRates(
      totalIncome,
      totalBudgeted,
      actualExpenseForRate
    );

    return {
      month,
      dateFrom: start,
      dateTo: endInclusive,
      lines,
      totalBudgeted,
      totalActual,
      totalIncome,
      ...rates,
    };
  }

  /** FR-BUD-006 — copy rows from fromMonth into toMonth (skip existing). */
  async copyMonth(
    householdId: string,
    input: CopyBudgetMonthInput
  ): Promise<BudgetMonthSummary> {
    if (input.fromMonth === input.toMonth) {
      throw new BadRequestException("fromMonth and toMonth must differ");
    }
    assertMonth(input.fromMonth);
    assertMonth(input.toMonth);

    const source = await this.repo.findByMonth(householdId, input.fromMonth);
    if (source.length === 0) {
      throw new NotFoundException(
        `No budgets found for ${input.fromMonth}`
      );
    }

    const existing = await this.repo.findByMonth(householdId, input.toMonth);
    const existingCats = new Set(existing.map((e) => e.categoryId));
    const toInsert = source
      .filter((s) => !existingCats.has(s.categoryId))
      .map((s) => ({
        householdId,
        categoryId: s.categoryId,
        month: input.toMonth,
        budgetedAmount: normalizeAmount(s.budgetedAmount),
      }));

    await this.repo.insertMany(toInsert);
    return this.getMonth(householdId, input.toMonth);
  }

  private async enrichLine(
    householdId: string,
    budget: Budget
  ): Promise<BudgetLineView> {
    const { start, endInclusive } = monthRange(budget.month);
    const actualMap = await this.transactions.sumExpenseByCategory({
      householdId,
      dateFromInclusive: start,
      dateToInclusive: endInclusive,
      categoryIds: [budget.categoryId],
    });
    return this.lineFromBudget(
      budget,
      actualMap.get(budget.categoryId) ?? "0.00"
    );
  }

  private lineFromBudget(budget: Budget, actual: string): BudgetLineView {
    const budgeted = normalizeAmount(budget.budgetedAmount);
    const { variance, percentOfBudgetUsed, health } = computeBudgetLine(
      budgeted,
      actual
    );
    return {
      id: budget.id,
      householdId: budget.householdId,
      categoryId: budget.categoryId,
      categoryName: budget.category?.name ?? budget.categoryId,
      month: budget.month,
      budgetedAmount: budgeted,
      actualAmount: normalizeAmount(actual),
      variance,
      percentOfBudgetUsed,
      health,
      createdAt: budget.createdAt,
      updatedAt: budget.updatedAt,
    };
  }
}

function normalizeAmount(value: string): string {
  return Number(value).toFixed(2);
}

function assertMonth(month: string): void {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new BadRequestException("month must be YYYY-MM");
  }
  const m = Number(month.slice(5));
  if (m < 1 || m > 12) {
    throw new BadRequestException("Invalid month");
  }
}
