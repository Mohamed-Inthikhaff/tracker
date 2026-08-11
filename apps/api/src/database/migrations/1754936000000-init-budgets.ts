import { MigrationInterface, QueryRunner } from "typeorm";

/** Phase 1 — monthly category budgets (FR-BUD-*). */
export class InitBudgets1754936000000 implements MigrationInterface {
  name = "InitBudgets1754936000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "budgets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "household_id" uuid NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
        "month" char(7) NOT NULL,
        "budgeted_amount" numeric(14, 2) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_budgets_amount_positive" CHECK ("budgeted_amount" > 0),
        CONSTRAINT "CHK_budgets_month_format" CHECK ("month" ~ '^[0-9]{4}-[0-9]{2}$'),
        CONSTRAINT "UQ_budgets_household_category_month"
          UNIQUE ("household_id", "category_id", "month")
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_budgets_household_month"
        ON "budgets" ("household_id", "month")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "budgets"`);
  }
}
