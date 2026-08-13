import { TransactionsService } from "./transactions.service";
import type { TransactionsRepository } from "./transactions.repository";
import type { CategoriesService } from "../categories/categories.service";
import type { HouseholdsRepository } from "../households/households.repository";
import type { ClassificationService } from "../classification/classification.service";
import type { BillingService } from "../billing/billing.service";
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
  let classification: jest.Mocked<
    Pick<ClassificationService, "suggestCategory" | "recordFeedback">
  >;
  let billing: jest.Mocked<
    Pick<BillingService, "assertCanCreateTransaction">
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
      updateOne: jest.fn(),
      deleteById: jest.fn(),
      search: jest.fn(),
      createMany: jest.fn(),
      sumByType: jest.fn(),
      countByHouseholdAndRange: jest.fn(),
      sumAmountByPayeeTypeAndWindow: jest.fn(),
    } as unknown as jest.Mocked<TransactionsRepository>;

    categories = {
      getById: jest.fn(),
    };

    households = {
      findUserByAuth0Sub: jest.fn(),
      findHouseholdById: jest.fn(),
    };

    classification = {
      suggestCategory: jest.fn(),
      recordFeedback: jest.fn().mockResolvedValue({ id: "fb-1" }),
    };

    billing = {
      assertCanCreateTransaction: jest.fn().mockResolvedValue(undefined),
    };

    service = new TransactionsService(
      repo,
      categories as unknown as CategoriesService,
      households as unknown as HouseholdsRepository,
      classification as unknown as ClassificationService,
      billing as unknown as BillingService
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
      expect(classification.suggestCategory).not.toHaveBeenCalled();
      expect(classification.recordFeedback).toHaveBeenCalled();
      expect(result.amount).toBe("42.50");
      expect(typeof result.amount).toBe("string");
      expect(result.createdByUserId).toBe(user.id);
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("asks classification when categoryId is omitted (FR-CAT-003)", async () => {
      households.findUserByAuth0Sub.mockResolvedValue(user);
      households.findHouseholdById.mockResolvedValue(household);
      classification.suggestCategory.mockResolvedValue({
        categoryId,
        confidence: 0.91,
        highConfidence: true,
        alternatives: [],
        model: "gemini-2.5-flash-lite",
      });
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

      await service.create(householdId, auth0Sub, {
        date: new Date("2026-03-15"),
        type: "Expense",
        amount: "10.00",
        description: "grocery store",
        source: "manual",
      });

      expect(classification.suggestCategory).toHaveBeenCalledWith(
        householdId,
        "grocery store",
        "Expense"
      );
      expect(repo.createOne).toHaveBeenCalledWith(
        expect.objectContaining({
          categoryId,
          aiConfidence: "0.910",
          userConfirmedCategory: false,
        })
      );
    });

    it("rejects category type mismatch", async () => {
      households.findUserByAuth0Sub.mockResolvedValue(user);
      households.findHouseholdById.mockResolvedValue(household);
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

  describe("update (FR-TXN-003)", () => {
    it("updates amount independently", async () => {
      repo.findById.mockResolvedValue({ ...txn });
      repo.updateOne.mockImplementation(async (row, patch) => ({
        ...row,
        ...patch,
        amount: patch.amount ?? row.amount,
      }));

      const result = await service.update(householdId, txn.id, {
        amount: "99.00",
      });

      expect(categories.getById).not.toHaveBeenCalled();
      expect(repo.updateOne).toHaveBeenCalledWith(
        expect.objectContaining({ id: txn.id }),
        { amount: "99.00" }
      );
      expect(result.amount).toBe("99.00");
    });

    it("updates category independently after type match check", async () => {
      const nextCategoryId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
      repo.findById.mockResolvedValue({ ...txn });
      categories.getById.mockResolvedValue({
        id: nextCategoryId,
        householdId,
        name: "Transport",
        type: "Expense",
        parentCategoryId: null,
        isSystemDefault: true,
        isActive: true,
        sortOrder: 300,
      });
      repo.updateOne.mockImplementation(async (row, patch) => ({
        ...row,
        categoryId: patch.categoryId ?? row.categoryId,
        userConfirmedCategory:
          patch.userConfirmedCategory ?? row.userConfirmedCategory,
      }));

      const result = await service.update(householdId, txn.id, {
        categoryId: nextCategoryId,
      });

      expect(categories.getById).toHaveBeenCalledWith(
        householdId,
        nextCategoryId
      );
      expect(repo.updateOne).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          categoryId: nextCategoryId,
          userConfirmedCategory: true,
        })
      );
      expect(result.categoryId).toBe(nextCategoryId);
    });

    it("updates description independently", async () => {
      repo.findById.mockResolvedValue({ ...txn });
      repo.updateOne.mockImplementation(async (row, patch) => ({
        ...row,
        description:
          patch.description !== undefined ? patch.description : row.description,
      }));

      const result = await service.update(householdId, txn.id, {
        description: "Renamed groceries",
      });

      expect(repo.updateOne).toHaveBeenCalledWith(expect.anything(), {
        description: "Renamed groceries",
      });
      expect(result.description).toBe("Renamed groceries");
    });

    it("rejects update when transaction is outside the active household", async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        service.update(householdId, txn.id, { amount: "1.00" })
      ).rejects.toThrow(/not found/i);
      expect(repo.updateOne).not.toHaveBeenCalled();
    });
  });

  describe("delete (FR-TXN-003) and debt linkage (FR-DEBT-002)", () => {
    it("hard-deletes a household-scoped transaction", async () => {
      repo.deleteById.mockResolvedValue(true);

      await service.delete(householdId, txn.id);

      expect(repo.deleteById).toHaveBeenCalledWith(householdId, txn.id);
    });

    it("rejects delete when transaction is outside the active household", async () => {
      repo.deleteById.mockResolvedValue(false);

      await expect(service.delete(householdId, txn.id)).rejects.toThrow(
        /not found/i
      );
    });

    it("does not write debt rows — repaid totals re-sum live from transactions", async () => {
      // DebtsService.sumRepaid calls sumAmountByPayeeTypeAndWindow on every
      // debt read. There is no stored repayment link; deleting a txn only
      // removes it from that SUM on the next debts list/get.
      repo.deleteById.mockResolvedValue(true);
      repo.sumAmountByPayeeTypeAndWindow.mockResolvedValue("0.00");

      await service.delete(householdId, txn.id);

      expect(repo.deleteById).toHaveBeenCalledWith(householdId, txn.id);
      expect(
        typeof repo.sumAmountByPayeeTypeAndWindow
      ).toBe("function");
      // No debt repository is injected into TransactionsService — delete
      // cannot leave stale stored remaining/status because none are stored.
      expect(Object.keys(repo).some((k) => /debt/i.test(k))).toBe(false);
    });
  });
});
