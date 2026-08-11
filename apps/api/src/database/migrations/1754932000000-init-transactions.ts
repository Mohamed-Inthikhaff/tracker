import { MigrationInterface, QueryRunner } from "typeorm";

/** Phase 0 — transactions table (create/read only in this phase). */
export class InitTransactions1754932000000 implements MigrationInterface {
  name = "InitTransactions1754932000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "transactions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "household_id" uuid NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
        "created_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "txn_date" date NOT NULL,
        "type" varchar(32) NOT NULL,
        "amount" numeric(14, 2) NOT NULL,
        "currency" char(3) NOT NULL DEFAULT 'USD',
        "description" varchar(280) NULL,
        "payee" varchar(120) NULL,
        "notes" varchar(1000) NULL,
        "source" varchar(32) NOT NULL,
        "ai_confidence" numeric(4, 3) NULL,
        "user_confirmed_category" boolean NOT NULL DEFAULT true,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_transactions_amount_positive" CHECK ("amount" > 0)
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_transactions_household_date"
        ON "transactions" ("household_id", "txn_date" DESC)
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_transactions_household_type"
        ON "transactions" ("household_id", "type")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_transactions_household_category"
        ON "transactions" ("household_id", "category_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "transactions"`);
  }
}
