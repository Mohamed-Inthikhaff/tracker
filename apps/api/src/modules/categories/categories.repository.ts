import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import type { CategoryType } from "@expense-tracker/types";
import { Category } from "./entities/category.entity";
import {
  buildDefaultCategoryRows,
  type SeedCategoryRow,
} from "../../database/seeds/default-categories.seed";

@Injectable()
export class CategoriesRepository {
  constructor(
    @InjectRepository(Category)
    private readonly categories: Repository<Category>
  ) {}

  countForHousehold(householdId: string): Promise<number> {
    return this.categories.count({ where: { householdId } });
  }

  findByHousehold(
    householdId: string,
    opts: { includeInactive?: boolean; type?: CategoryType } = {}
  ): Promise<Category[]> {
    const where: {
      householdId: string;
      isActive?: boolean;
      type?: CategoryType;
    } = { householdId };
    if (!opts.includeInactive) {
      where.isActive = true;
    }
    if (opts.type) {
      where.type = opts.type;
    }
    return this.categories.find({
      where,
      order: { sortOrder: "ASC", name: "ASC" },
    });
  }

  findById(householdId: string, id: string): Promise<Category | null> {
    return this.categories.findOne({ where: { id, householdId } });
  }

  findByIds(householdId: string, ids: string[]): Promise<Category[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.categories.find({
      where: { householdId, id: In(ids) },
    });
  }

  findByNameType(
    householdId: string,
    name: string,
    type: CategoryType
  ): Promise<Category | null> {
    return this.categories.findOne({
      where: { householdId, name, type },
    });
  }

  createOne(data: {
    householdId: string;
    name: string;
    type: CategoryType;
    parentCategoryId: string | null;
    isSystemDefault?: boolean;
    isActive?: boolean;
    sortOrder: number;
  }): Promise<Category> {
    return this.categories.save(
      this.categories.create({
        isSystemDefault: false,
        isActive: true,
        ...data,
      })
    );
  }

  save(category: Category): Promise<Category> {
    return this.categories.save(category);
  }

  async saveMany(categories: Category[]): Promise<Category[]> {
    return this.categories.save(categories);
  }

  maxSortOrder(householdId: string, type: CategoryType): Promise<number> {
    return this.categories
      .createQueryBuilder("c")
      .select("COALESCE(MAX(c.sort_order), 0)", "max")
      .where("c.household_id = :householdId", { householdId })
      .andWhere("c.type = :type", { type })
      .getRawOne<{ max: string }>()
      .then((row) => Number(row?.max ?? 0));
  }

  /**
   * Insert default seed rows; resolves parent IDs by (type, name) within batch.
   * Idempotent at the call-site (caller skips if count > 0).
   */
  async insertDefaultSeeds(householdId: string): Promise<Category[]> {
    const rows: SeedCategoryRow[] = buildDefaultCategoryRows(householdId);
    const created: Category[] = [];
    const byKey = new Map<string, Category>();

    for (const row of rows) {
      let parentCategoryId: string | null = null;
      if (row.parentName) {
        const parent = byKey.get(`${row.type}:${row.parentName}`);
        parentCategoryId = parent?.id ?? null;
      }

      const entity = await this.createOne({
        householdId: row.householdId,
        name: row.name,
        type: row.type,
        parentCategoryId,
        isSystemDefault: true,
        isActive: true,
        sortOrder: row.sortOrder,
      });
      byKey.set(`${row.type}:${row.name}`, entity);
      created.push(entity);
    }

    return created;
  }
}
