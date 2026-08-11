import { CategoriesService } from "./categories.service";
import type { CategoriesRepository } from "./categories.repository";
import type { Category } from "./entities/category.entity";
import { DEFAULT_CATEGORY_SEEDS } from "../../database/seeds/default-categories.seed";

describe("CategoriesService", () => {
  let service: CategoriesService;
  let repo: jest.Mocked<CategoriesRepository>;

  const householdId = "33333333-3333-3333-3333-333333333333";

  const food: Category = {
    id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    householdId,
    name: "Food",
    type: "Expense",
    parentCategoryId: null,
    isSystemDefault: true,
    isActive: true,
    sortOrder: 200,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    repo = {
      countForHousehold: jest.fn(),
      findByHousehold: jest.fn(),
      findById: jest.fn(),
      findByIds: jest.fn(),
      findByNameType: jest.fn(),
      createOne: jest.fn(),
      save: jest.fn(),
      saveMany: jest.fn(),
      maxSortOrder: jest.fn(),
      insertDefaultSeeds: jest.fn(),
    } as unknown as jest.Mocked<CategoriesRepository>;

    service = new CategoriesService(repo);
  });

  describe("seedDefaultsForHousehold (FR-CAT-001)", () => {
    it("inserts default categories from the seed file when household has none", async () => {
      repo.countForHousehold.mockResolvedValue(0);
      const seeded = DEFAULT_CATEGORY_SEEDS.slice(0, 3).map((s, i) => ({
        id: `00000000-0000-0000-0000-00000000000${i}`,
        householdId,
        name: s.name,
        type: s.type,
        parentCategoryId: null,
        isSystemDefault: true,
        isActive: true,
        sortOrder: s.sortOrder,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as Category[];
      repo.insertDefaultSeeds.mockResolvedValue(seeded);

      const result = await service.seedDefaultsForHousehold(householdId);

      expect(repo.insertDefaultSeeds).toHaveBeenCalledWith(householdId);
      expect(result).toHaveLength(3);
      expect(result[0]?.isSystemDefault).toBe(true);
    });

    it("is idempotent when categories already exist", async () => {
      repo.countForHousehold.mockResolvedValue(5);
      repo.findByHousehold.mockResolvedValue([food]);

      const result = await service.seedDefaultsForHousehold(householdId);

      expect(repo.insertDefaultSeeds).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe("Food");
    });

    it("exposes the full default seed list size", () => {
      expect(service.defaultSeedCount()).toBe(DEFAULT_CATEGORY_SEEDS.length);
      expect(service.defaultSeedCount()).toBeGreaterThan(10);
    });
  });

  describe("create / nest / deactivate / reorder (FR-CAT-002)", () => {
    it("creates a nested category under a same-type parent", async () => {
      repo.findByNameType.mockResolvedValue(null);
      repo.findById.mockResolvedValue(food);
      repo.maxSortOrder.mockResolvedValue(200);
      const child: Category = {
        ...food,
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        name: "Coffee",
        parentCategoryId: food.id,
        isSystemDefault: false,
        sortOrder: 210,
      };
      repo.createOne.mockResolvedValue(child);

      const result = await service.create(householdId, {
        name: "Coffee",
        type: "Expense",
        parentCategoryId: food.id,
      });

      expect(result.parentCategoryId).toBe(food.id);
      expect(repo.createOne).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Coffee",
          type: "Expense",
          parentCategoryId: food.id,
        })
      );
    });

    it("renames a category", async () => {
      repo.findById.mockResolvedValue({ ...food });
      repo.findByNameType.mockResolvedValue(null);
      repo.save.mockImplementation(async (c) => c);

      const result = await service.update(householdId, food.id, {
        name: "Groceries & Markets",
      });

      expect(result.name).toBe("Groceries & Markets");
    });

    it("deactivates a category without deleting it", async () => {
      repo.findById.mockResolvedValue({ ...food, isActive: true });
      repo.save.mockImplementation(async (c) => c);

      const result = await service.deactivate(householdId, food.id);

      expect(result.isActive).toBe(false);
      expect(repo.save).toHaveBeenCalled();
    });

    it("reorders categories by orderedIds", async () => {
      const a = { ...food, id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", sortOrder: 10 };
      const b = {
        ...food,
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        name: "Transport",
        sortOrder: 20,
      };
      repo.findByIds.mockResolvedValue([a, b]);
      repo.saveMany.mockImplementation(async (cats) => cats);

      const result = await service.reorder(householdId, {
        orderedIds: [b.id, a.id],
      });

      expect(result[0]?.id).toBe(b.id);
      expect(result[0]?.sortOrder).toBe(10);
      expect(result[1]?.sortOrder).toBe(20);
    });
  });
});
