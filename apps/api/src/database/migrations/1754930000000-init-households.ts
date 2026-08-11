import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Phase 0 core tenancy tables: users, households, household_members, household_invites.
 */
export class InitHouseholds1754930000000 implements MigrationInterface {
  name = "InitHouseholds1754930000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "auth0_sub" varchar(128) NOT NULL,
        "email" varchar(320) NOT NULL,
        "display_name" varchar(120) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_auth0_sub" UNIQUE ("auth0_sub"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "households" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "base_currency" char(3) NOT NULL DEFAULT 'USD',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMPTZ NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "household_members" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "household_id" uuid NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role" varchar(32) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "removed_at" TIMESTAMPTZ NULL,
        CONSTRAINT "UQ_household_members_household_user" UNIQUE ("household_id", "user_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_household_members_user"
        ON "household_members" ("user_id")
        WHERE "removed_at" IS NULL
    `);

    await queryRunner.query(`
      CREATE TABLE "household_invites" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "household_id" uuid NOT NULL REFERENCES "households"("id") ON DELETE CASCADE,
        "email" varchar(320) NOT NULL,
        "role" varchar(32) NOT NULL,
        "token" varchar(64) NOT NULL,
        "status" varchar(32) NOT NULL DEFAULT 'pending',
        "invited_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
        "expires_at" TIMESTAMPTZ NOT NULL,
        "accepted_by_user_id" uuid NULL REFERENCES "users"("id"),
        "accepted_at" TIMESTAMPTZ NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_household_invites_token" UNIQUE ("token")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_household_invites_email"
        ON "household_invites" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "household_invites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "household_members"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "households"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }
}
