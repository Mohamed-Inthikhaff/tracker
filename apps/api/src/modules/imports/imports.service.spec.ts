import {
  parseCsv,
  rowsToRecords,
  suggestColumnMapping,
} from "./import-csv.parser";
import {
  buildImportPreview,
  normalizeAmount,
  normalizeDate,
} from "./import-preview.builder";
import { ImportsService } from "./imports.service";
import type { ImportsRepository } from "./imports.repository";
import type { CategoriesService } from "../categories/categories.service";
import type { HouseholdsRepository } from "../households/households.repository";
import type { TransactionsRepository } from "../transactions/transactions.repository";
import type { ImportBatch } from "./entities/import-batch.entity";
import type { User } from "../households/entities/user.entity";
import type { Household } from "../households/entities/household.entity";
import type { Transaction } from "../transactions/entities/transaction.entity";

const SAMPLE_CSV = `Date,Day,Type,Category,Person/Payee,Description,Amount (Rs),Notes
2026-01-01,Thursday,Expense,Daily Routine/Misc,,Friends outing,1600,
2026-01-01,Thursday,Income,Salary,,Salary,85104,
2026-01-03,Saturday,Expense,Food,,Diet Food,2070,`;

describe("import-csv.parser", () => {
  it("parses spreadsheet-style headers and rows (FR-IMP-001)", () => {
    const { headers, rows } = parseCsv(SAMPLE_CSV);
    expect(headers).toContain("Amount (Rs)");
    expect(rows).toHaveLength(3);
    const mapping = suggestColumnMapping(headers);
    expect(mapping["Date"]).toBe("date");
    expect(mapping["Type"]).toBe("type");
    expect(mapping["Category"]).toBe("category");
    expect(mapping["Amount (Rs)"]).toBe("amount");
    expect(mapping["Person/Payee"]).toBe("payee");
  });
});

describe("import-preview.builder", () => {
  const mapping = {
    Date: "date",
    Day: "skip",
    Type: "type",
    Category: "category",
    "Person/Payee": "payee",
    Description: "description",
    "Amount (Rs)": "amount",
    Notes: "notes",
  } as const;

  it("flags unmapped categories (FR-IMP-002)", () => {
    const { headers, rows } = parseCsv(SAMPLE_CSV);
    const records = rowsToRecords(headers, rows);
    const preview = buildImportPreview(
      records,
      mapping,
      [
        {
          id: "cat-salary",
          name: "Salary",
          type: "Income",
          isActive: true,
        },
      ],
      []
    );

    expect(preview.unmappedCategories.some((u) => u.sourceName === "Daily Routine/Misc")).toBe(
      true
    );
    expect(preview.unmappedCategories.some((u) => u.sourceName === "Food")).toBe(
      true
    );
    expect(preview.readyCount).toBe(1); // salary only
  });

  it("accepts remap to existing category and builds ready rows (FR-IMP-003)", () => {
    const { headers, rows } = parseCsv(SAMPLE_CSV);
    const records = rowsToRecords(headers, rows);
    const preview = buildImportPreview(
      records,
      mapping,
      [
        {
          id: "cat-salary",
          name: "Salary",
          type: "Income",
          isActive: true,
        },
        {
          id: "cat-misc",
          name: "Misc",
          type: "Expense",
          isActive: true,
        },
        {
          id: "cat-food",
          name: "Food",
          type: "Expense",
          isActive: true,
        },
      ],
      [
        {
          sourceName: "Daily Routine/Misc",
          type: "Expense",
          targetCategoryId: "cat-misc",
        },
      ]
    );

    expect(preview.unmappedCategories).toHaveLength(0);
    expect(preview.readyCount).toBe(3);
    expect(preview.failedCount).toBe(0);
  });

  it("normalizes excel serial dates and money strings", () => {
    expect(normalizeDate("46023")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(normalizeAmount("1,600")).toBe("1600.00");
    expect(normalizeAmount("42.5")).toBe("42.50");
  });
});

describe("ImportsService", () => {
  let service: ImportsService;
  let repo: jest.Mocked<ImportsRepository>;
  let categories: jest.Mocked<
    Pick<CategoriesService, "list" | "create">
  >;
  let households: jest.Mocked<
    Pick<HouseholdsRepository, "findUserByAuth0Sub" | "findHouseholdById">
  >;
  let transactions: jest.Mocked<Pick<TransactionsRepository, "createMany">>;

  const householdId = "33333333-3333-3333-3333-333333333333";
  const auth0Sub = "auth0|owner";
  const user: User = {
    id: "11111111-1111-1111-1111-111111111111",
    auth0Sub,
    email: "o@example.com",
    displayName: "Owner",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const household: Household = {
    id: householdId,
    name: "HH",
    baseCurrency: "LKR",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
      updatePreview: jest.fn(),
      markCommitted: jest.fn(),
    } as unknown as jest.Mocked<ImportsRepository>;

    categories = {
      list: jest.fn(),
      create: jest.fn(),
    };
    households = {
      findUserByAuth0Sub: jest.fn(),
      findHouseholdById: jest.fn(),
    };
    transactions = {
      createMany: jest.fn(),
    };

    service = new ImportsService(
      repo,
      categories as unknown as CategoriesService,
      households as unknown as HouseholdsRepository,
      transactions as unknown as TransactionsRepository
    );
  });

  it("commits rows with source = csv_import (FR-IMP-004)", async () => {
    const { headers, rows } = parseCsv(SAMPLE_CSV);
    const batch = {
      id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      householdId,
      createdByUserId: user.id,
      status: "previewed",
      filename: "tx.csv",
      headers,
      rows: rowsToRecords(headers, rows),
      suggestedMapping: suggestColumnMapping(headers),
      mapping: null,
      categoryRemaps: null,
      previewSummary: null,
      committedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ImportBatch;

    households.findUserByAuth0Sub.mockResolvedValue(user);
    households.findHouseholdById.mockResolvedValue(household);
    repo.findById.mockResolvedValue(batch);
    categories.list.mockResolvedValue([
      {
        id: "cat-salary",
        householdId,
        name: "Salary",
        type: "Income",
        parentCategoryId: null,
        isSystemDefault: true,
        isActive: true,
        sortOrder: 10,
      },
      {
        id: "cat-misc",
        householdId,
        name: "Misc",
        type: "Expense",
        parentCategoryId: null,
        isSystemDefault: true,
        isActive: true,
        sortOrder: 20,
      },
      {
        id: "cat-food",
        householdId,
        name: "Food",
        type: "Expense",
        parentCategoryId: null,
        isSystemDefault: true,
        isActive: true,
        sortOrder: 30,
      },
    ]);
    transactions.createMany.mockResolvedValue([
      { id: "t1" },
      { id: "t2" },
      { id: "t3" },
    ] as Transaction[]);

    const mapping = suggestColumnMapping(headers) as never;
    const result = await service.commit(householdId, auth0Sub, batch.id, {
      mapping,
      categoryRemaps: [
        {
          sourceName: "Daily Routine/Misc",
          type: "Expense",
          targetCategoryId: "cat-misc",
        },
      ],
    });

    expect(result.source).toBe("csv_import");
    expect(result.createdCount).toBe(3);
    expect(transactions.createMany).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ source: "csv_import", currency: "LKR" }),
      ])
    );
    expect(repo.markCommitted).toHaveBeenCalledWith(batch.id, 3);
  });
});
