import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { HouseholdMember } from "./household-member.entity";

/**
 * Minimal user row for household membership FKs.
 * Auth0 profile fields expand when the auth module lands (FR-AUTH-001).
 */
@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ name: "auth0_sub", type: "varchar", length: 128 })
  auth0Sub!: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 320 })
  email!: string;

  @Column({ name: "display_name", type: "varchar", length: 120 })
  displayName!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @OneToMany("HouseholdMember", "user")
  memberships?: HouseholdMember[];
}
