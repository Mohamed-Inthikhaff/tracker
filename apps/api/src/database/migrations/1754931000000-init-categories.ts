import { MigrationInterface, QueryRunner } from "typeorm";

/** Phase 0 — categories table (FR-CAT-001 / FR-CAT-002). */
export class InitCategories1754931000000 implements MigrationInterface {
  name = "InitCategories1754931000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "household_id" uuid NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "name" varchar(80) NOT NULL,
        "type" varchar(32) NOT NULL,
        "parent_category_id" uuid NULL REFERENCES "categories"("id") ON DELETE SET NULL,
        "is_system_default" boolean NOT NULL DEFAULT false,
        "is_active" boolean NOT NULL DEFAULT true,
        "sort_order" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_categories_household_name_type"
          UNIQUE ("household_id", "name", "type")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_categories_household_sort"
        ON "categories" ("household_id", "sort_order")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
  }
}
