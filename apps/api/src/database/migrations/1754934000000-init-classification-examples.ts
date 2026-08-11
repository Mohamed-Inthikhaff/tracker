import { MigrationInterface, QueryRunner } from "typeorm";

/** Phase 1 — classification few-shot examples (FR-CAT-006). */
export class InitClassificationExamples1754934000000
  implements MigrationInterface
{
  name = "InitClassificationExamples1754934000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "classification_examples" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "household_id" uuid NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "description" varchar(280) NOT NULL,
        "category_id" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
        "user_accepted" boolean NOT NULL,
        "suggested_category_id" uuid NULL REFERENCES "categories"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_classification_examples_household_created"
        ON "classification_examples" ("household_id", "created_at" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "classification_examples"`);
  }
}
