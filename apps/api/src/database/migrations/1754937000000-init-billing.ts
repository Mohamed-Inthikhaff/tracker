import { MigrationInterface, QueryRunner } from "typeorm";

/** Phase 1 — Stripe subscriptions + webhook idempotency (FR-BILL-*). */
export class InitBilling1754937000000 implements MigrationInterface {
  name = "InitBilling1754937000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "household_id" uuid NOT NULL UNIQUE
          REFERENCES "households"("id") ON DELETE CASCADE,
        "stripe_customer_id" varchar(64) NULL,
        "stripe_subscription_id" varchar(64) NULL,
        "plan" varchar(16) NOT NULL DEFAULT 'free',
        "status" varchar(16) NOT NULL DEFAULT 'free',
        "billing_cycle" varchar(16) NULL,
        "current_period_end" TIMESTAMPTZ NULL,
        "cancel_at_period_end" boolean NOT NULL DEFAULT false,
        "last_payment_status" varchar(16) NULL,
        "ocr_usage_month" char(7) NULL,
        "ocr_usage_count" int NOT NULL DEFAULT 0,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_subscriptions_stripe_customer"
        ON "subscriptions" ("stripe_customer_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_subscriptions_stripe_subscription"
        ON "subscriptions" ("stripe_subscription_id")
    `);
    await queryRunner.query(`
      CREATE TABLE "stripe_webhook_events" (
        "id" varchar(128) PRIMARY KEY,
        "type" varchar(80) NOT NULL,
        "processed_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "stripe_webhook_events"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "subscriptions"`);
  }
}
