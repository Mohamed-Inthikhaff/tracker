import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CategoryType,
  CreateCategoryInput,
  ReorderCategoriesInput,
  UpdateCategoryInput,
} from "@expense-tracker/types";
import { CategoriesRepository } from "./categories.repository";
import type { CategoryView } from "./interfaces/category.interface";
import { Category } from "./entities/category.entity";
import { DEFAULT_CATEGORY_SEEDS } from "../../database/seeds/default-categories.seed";

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  /**
   * FR-CAT-001 — seed default categories for a new household.
   * Seeds live in database/seeds/default-categories.seed.ts (not here).
   * Idempotent: no-op if the household already has any categories.
   */
  async seedDefaultsForHousehold(householdId: string): Promise<CategoryView[]> {
    const existing = await this.repo.countForHousehold(householdId);
    if (existing > 0) {
      const list = await this.repo.findByHousehold(householdId, {
        includeInactive: true,
      });
      return list.map(toView);
    }
    const created = await this.repo.insertDefaultSeeds(householdId);
    return created.map(toView);
  }

  /** Expected default seed size (for tests / health). */
  defaultSeedCount(): number {
    return DEFAULT_CATEGORY_SEEDS.length;
  }

  async list(
    householdId: string,
    opts: { includeInactive?: boolean; type?: CategoryType } = {}
  ): Promise<CategoryView[]> {
    const list = await this.repo.findByHousehold(householdId, opts);
    return list.map(toView);
  }

  async getById(householdId: string, id: string): Promise<CategoryView> {
    return toView(await this.requireCategory(householdId, id));
  }

  /** FR-CAT-002 — create custom category (optionally nested). */
  async create(
    householdId: string,
    input: CreateCategoryInput
  ): Promise<CategoryView> {
    const name = input.name.trim();
    await this.assertUniqueName(householdId, name, input.type);

    let parentCategoryId: string | null = input.parentCategoryId ?? null;
    if (parentCategoryId) {
      const parent = await this.requireCategory(householdId, parentCategoryId);
      if (parent.type !== input.type) {
        throw new BadRequestException(
          "Parent category must be the same type as the child"
        );
      }
      if (!parent.isActive) {
        throw new BadRequestException("Parent category is inactive");
      }
    }

    const max = await this.repo.maxSortOrder(householdId, input.type);
    const created = await this.repo.createOne({
      householdId,
      name,
      type: input.type,
      parentCategoryId,
      sortOrder: max + 10,
    });
    return toView(created);
  }

  /** FR-CAT-002 — rename and/or re-parent. */
  async update(
    householdId: string,
    id: string,
    input: UpdateCategoryInput
  ): Promise<CategoryView> {
    const category = await this.requireCategory(householdId, id);

    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name !== category.name) {
        await this.assertUniqueName(householdId, name, category.type, id);
        category.name = name;
      }
    }

    if (input.parentCategoryId !== undefined) {
      category.parentCategoryId = await this.resolveParent(
        householdId,
        category,
        input.parentCategoryId
      );
    }

    return toView(await this.repo.save(category));
  }

  /** FR-CAT-002 — soft deactivate (keeps history intact). */
  async deactivate(householdId: string, id: string): Promise<CategoryView> {
    const category = await this.requireCategory(householdId, id);
    if (!category.isActive) {
      return toView(category);
    }
    category.isActive = false;
    return toView(await this.repo.save(category));
  }

  async activate(householdId: string, id: string): Promise<CategoryView> {
    const category = await this.requireCategory(householdId, id);
    category.isActive = true;
    return toView(await this.repo.save(category));
  }

  /** FR-CAT-002 — set sort_order from ordered id list (same household). */
  async reorder(
    householdId: string,
    input: ReorderCategoriesInput
  ): Promise<CategoryView[]> {
    const uniqueIds = [...new Set(input.orderedIds)];
    const found = await this.repo.findByIds(householdId, uniqueIds);
    if (found.length !== uniqueIds.length) {
      throw new BadRequestException(
        "One or more category ids are invalid for this household"
      );
    }

    const byId = new Map(found.map((c) => [c.id, c]));
    const updated: Category[] = [];
    uniqueIds.forEach((id, index) => {
      const cat = byId.get(id)!;
      cat.sortOrder = (index + 1) * 10;
      updated.push(cat);
    });

    const saved = await this.repo.saveMany(updated);
    saved.sort((a, b) => a.sortOrder - b.sortOrder);
    return saved.map(toView);
  }

  private async resolveParent(
    householdId: string,
    category: Category,
    parentCategoryId: string | null
  ): Promise<string | null> {
    if (parentCategoryId === null) {
      return null;
    }
    if (parentCategoryId === category.id) {
      throw new BadRequestException("Category cannot be its own parent");
    }
    const parent = await this.requireCategory(householdId, parentCategoryId);
    if (parent.type !== category.type) {
      throw new BadRequestException(
        "Parent category must be the same type as the child"
      );
    }
    // Block trivial cycles (parent is already a descendant).
    if (await this.isDescendantOf(householdId, parent.id, category.id)) {
      throw new BadRequestException(
        "Cannot nest a category under one of its descendants"
      );
    }
    return parent.id;
  }

  private async isDescendantOf(
    householdId: string,
    nodeId: string,
    ancestorId: string
  ): Promise<boolean> {
    const all = await this.repo.findByHousehold(householdId, {
      includeInactive: true,
    });
    const childrenOf = new Map<string, string[]>();
    for (const c of all) {
      if (!c.parentCategoryId) continue;
      const list = childrenOf.get(c.parentCategoryId) ?? [];
      list.push(c.id);
      childrenOf.set(c.parentCategoryId, list);
    }

    const stack = [...(childrenOf.get(ancestorId) ?? [])];
    while (stack.length) {
      const id = stack.pop()!;
      if (id === nodeId) return true;
      stack.push(...(childrenOf.get(id) ?? []));
    }
    return false;
  }

  private async assertUniqueName(
    householdId: string,
    name: string,
    type: CategoryType,
    excludeId?: string
  ): Promise<void> {
    const existing = await this.repo.findByNameType(householdId, name, type);
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Category "${name}" already exists for type ${type}`
      );
    }
  }

  private async requireCategory(
    householdId: string,
    id: string
  ): Promise<Category> {
    const category = await this.repo.findById(householdId, id);
    if (!category) {
      throw new NotFoundException("Category not found");
    }
    return category;
  }
}

function toView(category: Category): CategoryView {
  return {
    id: category.id,
    householdId: category.householdId,
    name: category.name,
    type: category.type,
    parentCategoryId: category.parentCategoryId,
    isSystemDefault: category.isSystemDefault,
    isActive: category.isActive,
    sortOrder: category.sortOrder,
  };
}
