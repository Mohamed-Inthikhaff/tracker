import { BudgetsService } from "./budgets.service";
import type { BudgetsRepository } from "./budgets.repository";
import type { CategoriesService } from "../categories/categories.service";
import type { TransactionsRepository } from "../transactions/transactions.repository";
import type { Budget } from "./entities/budget.entity";

describe("BudgetsService", () => {
  let service: BudgetsService;
  let repo: jest.Mocked<
    Pick<
      BudgetsRepository,
      "findByMonth" | "findOne" | "upsert" | "insertMany"
    >
  >;
  let categories: jest.Mocked<Pick<CategoriesService, "getById">>;
  let transactions: jest.Mocked<
    Pick<TransactionsRepository, "sumExpenseByCategory" | "sumByType">
  >;

  const householdId = "11111111-1111-1111-1111-111111111111";
  const foodId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const rentId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  const foodBudget: Budget = {
    id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
    householdId,
    categoryId: foodId,
    month: "2026-08",
    budgetedAmount: "500.00",
    createdAt: new Date("2026-08-01T00:00:00Z"),
    updatedAt: new Date("2026-08-01T00:00:00Z"),
    category: { name: "Food" } as Budget["category"],
  };

  beforeEach(() => {
    repo = {
      findByMonth: jest.fn(),
      findOne: jest.fn(),
      upsert: jest.fn(),
      insertMany: jest.fn().mockResolvedValue([]),
    };
    categories = {
      getById: jest.fn().mockResolvedValue({
        id: foodId,
        householdId,
        name: "Food",
        type: "Expense",
        parentCategoryId: null,
        isSystemDefault: true,
        isActive: true,
        sortOrder: 200,
      }),
    };
    transactions = {
      sumExpenseByCategory: jest.fn().mockResolvedValue(new Map()),
      sumByType: jest.fn().mockResolvedValue([
        { type: "Income", total: "2000.00", count: "1" },
        { type: "Expense", total: "900.00", count: "4" },
      ]),
    };
    service = new BudgetsService(
      repo as unknown as BudgetsRepository,
      categories as unknown as CategoriesService,
      transactions as unknown as TransactionsRepository
    );
  });

  it("sets a budget for an expense category (FR-BUD-001)", async () => {
    repo.upsert.mockResolvedValue(foodBudget);
    transactions.sumExpenseByCategory.mockResolvedValue(
      new Map([[foodId, "120.00"]])
    );

    const line = await service.set(householdId, {
      categoryId: foodId,
      month: "2026-08",
      budgetedAmount: "500",
    });

    expect(repo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        categoryId: foodId,
        month: "2026-08",
        budgetedAmount: "500.00",
      })
    );
    expect(line.actualAmount).toBe("120.00");
    expect(line.variance).toBe("-380.00");
    expect(line.health).toBe("Under");
  });

  it("rejects non-Expense categories", async () => {
    categories.getById.mockResolvedValue({
      id: foodId,
      householdId,
      name: "Salary",
      type: "Income",
      parentCategoryId: null,
      isSystemDefault: true,
      isActive: true,
      sortOrder: 10,
    });

    await expect(
      service.set(householdId, {
        categoryId: foodId,
        month: "2026-08",
        budgetedAmount: "100",
      })
    ).rejects.toThrow(/Expense categories only/);
  });

  it("getMonth recomputes actuals and savings rates (FR-BUD-002–005)", async () => {
    const rentBudget: Budget = {
      ...foodBudget,
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      categoryId: rentId,
      budgetedAmount: "400.00",
      category: { name: "Rent" } as Budget["category"],
    };
    repo.findByMonth.mockResolvedValue([foodBudget, rentBudget]);
    transactions.sumExpenseByCategory.mockResolvedValue(
      new Map([
        [foodId, "450.00"],
        [rentId, "400.00"],
      ])
    );

    const summary = await service.getMonth(householdId, "2026-08");

    expect(transactions.sumExpenseByCategory).toHaveBeenCalledWith({
      householdId,
      dateFromInclusive: "2026-08-01",
      dateToInclusive: "2026-08-31",
    });
    expect(summary.lines).toHaveLength(2);
    expect(summary.totalBudgeted).toBe("900.00");
    expect(summary.totalActual).toBe("850.00");
    expect(summary.totalIncome).toBe("2000.00");
    // savings vs budgeted: (2000-900)/2000 = 55%; vs actual household expense 900
    expect(summary.savingsRateVsBudgeted).toBe(55);
    expect(summary.savingsRateVsActual).toBe(55);
    expect(summary.lines.find((l) => l.categoryId === foodId)?.health).toBe(
      "Near"
    );
  });

  it("copies a prior month skipping existing categories (FR-BUD-006)", async () => {
    const julyFood: Budget = { ...foodBudget, month: "2026-07" };
    const augRent: Budget = {
      ...foodBudget,
      id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
      categoryId: rentId,
      month: "2026-08",
      budgetedAmount: "300.00",
      category: { name: "Rent" } as Budget["category"],
    };

    repo.findByMonth
      .mockResolvedValueOnce([julyFood]) // source
      .mockResolvedValueOnce([augRent]) // existing target check
      .mockResolvedValueOnce([
        { ...julyFood, id: "ffffffff-ffff-ffff-ffff-ffffffffffff", month: "2026-08" },
        augRent,
      ]); // getMonth after insert

    transactions.sumExpenseByCategory.mockResolvedValue(new Map());

    await service.copyMonth(householdId, {
      fromMonth: "2026-07",
      toMonth: "2026-08",
    });

    expect(repo.insertMany).toHaveBeenCalledWith([
      expect.objectContaining({
        categoryId: foodId,
        month: "2026-08",
        budgetedAmount: "500.00",
      }),
    ]);
  });
});
