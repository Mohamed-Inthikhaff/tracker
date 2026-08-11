import { DebtsService } from "./debts.service";
import type { DebtsRepository } from "./debts.repository";
import type { TransactionsRepository } from "../transactions/transactions.repository";
import type { Debt } from "./entities/debt.entity";

describe("DebtsService", () => {
  let service: DebtsService;
  let repo: jest.Mocked<
    Pick<
      DebtsRepository,
      "createOne" | "findById" | "listByHousehold" | "findSeries" | "updateOne"
    >
  >;
  let transactions: jest.Mocked<
    Pick<TransactionsRepository, "sumAmountByPayeeTypeAndWindow">
  >;

  const householdId = "11111111-1111-1111-1111-111111111111";

  const debtA: Debt = {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    householdId,
    personName: "Alex",
    direction: "OwedToMe",
    principalAmount: "1000.00",
    openedDate: "2026-01-01",
    notes: "First loan",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };

  const debtB: Debt = {
    id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    householdId,
    personName: "Alex",
    direction: "OwedToMe",
    principalAmount: "500.00",
    openedDate: "2026-03-01",
    notes: null,
    createdAt: new Date("2026-03-01T00:00:00Z"),
    updatedAt: new Date("2026-03-01T00:00:00Z"),
  };

  beforeEach(() => {
    repo = {
      createOne: jest.fn(),
      findById: jest.fn(),
      listByHousehold: jest.fn(),
      findSeries: jest.fn(),
      updateOne: jest.fn(),
    };
    transactions = {
      sumAmountByPayeeTypeAndWindow: jest.fn().mockResolvedValue("0.00"),
    };
    service = new DebtsService(
      repo as unknown as DebtsRepository,
      transactions as unknown as TransactionsRepository
    );
  });

  it("creates a debt and returns computed balances (FR-DEBT-001)", async () => {
    repo.createOne.mockResolvedValue(debtA);
    repo.findSeries.mockResolvedValue([debtA]);
    transactions.sumAmountByPayeeTypeAndWindow.mockResolvedValue("0.00");

    const view = await service.create(householdId, {
      personName: "Alex",
      direction: "OwedToMe",
      principalAmount: "1000",
      openedDate: new Date("2026-01-01"),
      notes: "First loan",
    });

    expect(repo.createOne).toHaveBeenCalledWith(
      expect.objectContaining({
        householdId,
        personName: "Alex",
        direction: "OwedToMe",
        principalAmount: "1000.00",
        openedDate: "2026-01-01",
      })
    );
    expect(view.status).toBe("Outstanding");
    expect(view.remaining).toBe("1000.00");
    expect(view.windowEndExclusive).toBeNull();
  });

  it("auto-closes prior window when a new debt opens (FR-DEBT-004)", async () => {
    repo.findById.mockResolvedValue(debtA);
    repo.findSeries.mockResolvedValue([debtA, debtB]);
    transactions.sumAmountByPayeeTypeAndWindow.mockResolvedValue("200.00");

    const view = await service.getById(householdId, debtA.id);

    expect(view.windowStart).toBe("2026-01-01");
    expect(view.windowEndExclusive).toBe("2026-03-01");
    expect(transactions.sumAmountByPayeeTypeAndWindow).toHaveBeenCalledWith({
      householdId,
      payee: "Alex",
      type: "DebtReceived",
      dateFromInclusive: "2026-01-01",
      dateToExclusive: "2026-03-01",
    });
    expect(view.repaidSoFar).toBe("200.00");
    expect(view.remaining).toBe("800.00");
    expect(view.status).toBe("PartiallyPaid");
  });

  it("attributes IOwe repayments via DebtGiven (FR-DEBT-002)", async () => {
    const iOwe: Debt = {
      ...debtA,
      id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      direction: "IOwe",
      principalAmount: "300.00",
    };
    repo.findById.mockResolvedValue(iOwe);
    repo.findSeries.mockResolvedValue([iOwe]);
    transactions.sumAmountByPayeeTypeAndWindow.mockResolvedValue("300.00");

    const view = await service.getById(householdId, iOwe.id);
    expect(transactions.sumAmountByPayeeTypeAndWindow).toHaveBeenCalledWith(
      expect.objectContaining({ type: "DebtGiven" })
    );
    expect(view.status).toBe("Settled");
    expect(view.remaining).toBe("0.00");
  });

  it("aggregates household totals (FR-DEBT-007)", async () => {
    const iOwe: Debt = {
      ...debtA,
      id: "dddddddd-dddd-dddd-dddd-dddddddddddd",
      direction: "IOwe",
      personName: "Sam",
      principalAmount: "100.00",
    };
    repo.listByHousehold.mockResolvedValue([debtA, iOwe]);
    repo.findSeries.mockImplementation(async (_h, person, direction) => {
      if (direction === "OwedToMe") return [debtA];
      return [iOwe];
    });
    transactions.sumAmountByPayeeTypeAndWindow.mockImplementation(async (o) => {
      if (o.payee === "Alex") return "250.00";
      return "40.00";
    });

    const totals = await service.listWithTotals(householdId);
    expect(totals.totalOwedToHousehold).toBe("750.00"); // 1000 - 250
    expect(totals.totalOwedByHousehold).toBe("60.00"); // 100 - 40
    expect(totals.debts).toHaveLength(2);
  });

  it("updates notes (FR-DEBT-006)", async () => {
    repo.findById.mockResolvedValue(debtA);
    repo.updateOne.mockResolvedValue({ ...debtA, notes: "updated" });
    repo.findSeries.mockResolvedValue([debtA]);

    const view = await service.update(householdId, debtA.id, {
      notes: "updated",
    });
    expect(repo.updateOne).toHaveBeenCalledWith(
      debtA,
      expect.objectContaining({ notes: "updated" })
    );
    expect(view.notes).toBe("updated");
  });
});
