import { MigrationInterface, QueryRunner } from "typeorm";

/** Phase 0 — CSV import batches (FR-IMP-001–004). */
export class InitImportBatches1754933000000 implements MigrationInterface {
  name = "InitImportBatches1754933000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "import_batches" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "household_id" uuid NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "created_by_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "status" varchar(32) NOT NULL DEFAULT 'uploaded',
        "filename" varchar(255) NULL,
        "headers" jsonb NOT NULL,
        "rows" jsonb NOT NULL,
        "suggested_mapping" jsonb NOT NULL,
        "mapping" jsonb NULL,
        "category_remaps" jsonb NULL,
        "preview_summary" jsonb NULL,
        "committed_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_import_batches_household"
        ON "import_batches" ("household_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "import_batches"`);
  }
}
