import { MigrationInterface, QueryRunner } from "typeorm";

/** Phase 1 — informal debt ledger (FR-DEBT-*). */
export class InitDebts1754935000000 implements MigrationInterface {
  name = "InitDebts1754935000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "debts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "household_id" uuid NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "person_name" varchar(120) NOT NULL,
        "direction" varchar(16) NOT NULL,
        "principal_amount" numeric(14, 2) NOT NULL,
        "opened_date" date NOT NULL,
        "notes" varchar(1000) NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_debts_principal_positive" CHECK ("principal_amount" > 0),
        CONSTRAINT "CHK_debts_direction"
          CHECK ("direction" IN ('IOwe', 'OwedToMe'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_debts_household_person_direction_opened"
        ON "debts" ("household_id", "person_name", "direction", "opened_date")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "debts"`);
  }
}
