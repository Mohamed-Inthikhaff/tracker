import { TransactionsService } from "./transactions.service";
import type { TransactionsRepository } from "./transactions.repository";
import type { CategoriesService } from "../categories/categories.service";
import type { HouseholdsRepository } from "../households/households.repository";
import type { Transaction } from "./entities/transaction.entity";
import type { User } from "../households/entities/user.entity";
import type { Household } from "../households/entities/household.entity";

describe("TransactionsService", () => {
  let service: TransactionsService;
  let repo: jest.Mocked<TransactionsRepository>;
  let categories: jest.Mocked<Pick<CategoriesService, "getById">>;
  let households: jest.Mocked<
    Pick<HouseholdsRepository, "findUserByAuth0Sub" | "findHouseholdById">
  >;

  const householdId = "33333333-3333-3333-3333-333333333333";
  const categoryId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const auth0Sub = "auth0|owner";

  const user: User = {
    id: "11111111-1111-1111-1111-111111111111",
    auth0Sub,
    email: "owner@example.com",
    displayName: "Owner",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const household: Household = {
    id: householdId,
    name: "My Household",
    baseCurrency: "USD",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const txn: Transaction = {
    id: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    householdId,
    categoryId,
    createdByUserId: user.id,
    txnDate: "2026-03-15",
    type: "Expense",
    amount: "42.50",
    currency: "USD",
    description: "Weekly groceries",
    payee: "Market",
    notes: null,
    source: "manual",
    aiConfidence: null,
    userConfirmedCategory: true,
    createdAt: new Date("2026-03-15T10:00:00Z"),
  };

  beforeEach(() => {
    repo = {
      createOne: jest.fn(),
      findById: jest.fn(),
      search: jest.fn(),
      createMany: jest.fn(),
      sumByType: jest.fn(),
      countByHouseholdAndRange: jest.fn(),
    } as unknown as jest.Mocked<TransactionsRepository>;

    categories = {
      getById: jest.fn(),
    };

    households = {
      findUserByAuth0Sub: jest.fn(),
      findHouseholdById: jest.fn(),
    };

    service = new TransactionsService(
      repo,
      categories as unknown as CategoriesService,
      households as unknown as HouseholdsRepository
    );
  });

  describe("create (FR-TXN-001 / FR-TXN-004 / FR-TXN-006)", () => {
    it("creates a transaction with decimal amount string and audit fields", async () => {
      households.findUserByAuth0Sub.mockResolvedValue(user);
      households.findHouseholdById.mockResolvedValue(household);
      categories.getById.mockResolvedValue({
        id: categoryId,
        householdId,
        name: "Food",
        type: "Expense",
        parentCategoryId: null,
        isSystemDefault: true,
        isActive: true,
        sortOrder: 200,
      });
      repo.createOne.mockResolvedValue(txn);

      const result = await service.create(householdId, auth0Sub, {
        date: new Date("2026-03-15T12:00:00Z"),
        type: "Expense",
        categoryId,
        amount: "42.5",
        description: "Weekly groceries",
        payee: "Market",
        source: "manual",
      });

      expect(repo.createOne).toHaveBeenCalledWith(
        expect.objectContaining({
          householdId,
          categoryId,
          createdByUserId: user.id,
          type: "Expense",
          amount: "42.50",
          currency: "USD",
          source: "manual",
          userConfirmedCategory: true,
          aiConfidence: null,
        })
      );
      expect(result.amount).toBe("42.50");
      expect(typeof result.amount).toBe("string");
      expect(result.createdByUserId).toBe(user.id);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("rejects category type mismatch", async () => {
      households.findUserByAuth0Sub.mockResolvedValue(user);
      categories.getById.mockResolvedValue({
        id: categoryId,
        householdId,
        name: "Salary",
        type: "Income",
        parentCategoryId: null,
        isSystemDefault: true,
        isActive: true,
        sortOrder: 10,
      });

      await expect(
        service.create(householdId, auth0Sub, {
          date: new Date("2026-03-15"),
          type: "Expense",
          categoryId,
          amount: "10.00",
          source: "manual",
        })
      ).rejects.toThrow(/does not match/);
      expect(repo.createOne).not.toHaveBeenCalled();
    });
  });

  describe("list (FR-TXN-005)", () => {
    it("forwards filters to the repository and returns paginated views", async () => {
      repo.search.mockResolvedValue({ items: [txn], total: 1 });

      const result = await service.list(householdId, {
        dateFrom: new Date("2026-03-01"),
        dateTo: new Date("2026-03-31"),
        type: "Expense",
        categoryId,
        q: "grocer",
        limit: 20,
        offset: 0,
      });

      expect(repo.search).toHaveBeenCalledWith(
        expect.objectContaining({
          householdId,
          type: "Expense",
          categoryId,
          q: "grocer",
          limit: 20,
          offset: 0,
        })
      );
      expect(result.total).toBe(1);
      expect(result.items[0]?.description).toBe("Weekly groceries");
      expect(result.items[0]?.amount).toBe("42.50");
    });
  });

  describe("monthlySummary (Phase 0 exit criterion)", () => {
    it("returns Dashboard-style Income/Expense/Net for a month", async () => {
      repo.sumByType.mockResolvedValue([
        { type: "Income", total: "72452.00", count: "5" },
        { type: "Expense", total: "45481.00", count: "16" },
      ]);
      repo.countByHouseholdAndRange.mockResolvedValue(21);

      const result = await service.monthlySummary(householdId, {
        month: "2026-08",
      });

      expect(result.month).toBe("2026-08");
      expect(result.dateFrom).toBe("2026-08-01");
      expect(result.dateTo).toBe("2026-08-31");
      expect(result.count).toBe(21);
      expect(result.byType.Income).toBe("72452.00");
      expect(result.byType.Expense).toBe("45481.00");
      expect(result.netBalance).toBe("26971.00");
    });
  });
});
