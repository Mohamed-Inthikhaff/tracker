import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { Household } from "./household.entity";
import type { User } from "./user.entity";
import type { HouseholdRole } from "@expense-tracker/types";

@Entity({ name: "household_members" })
@Index(["householdId", "userId"], { unique: true })
export class HouseholdMember {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "household_id", type: "uuid" })
  householdId!: string;

  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Column({ type: "varchar", length: 32 })
  role!: HouseholdRole;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  /** When set, membership is revoked (FR-AUTH-006). */
  @Column({ name: "removed_at", type: "timestamptz", nullable: true })
  removedAt!: Date | null;

  @ManyToOne("Household", "members", { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household?: Household;

  @ManyToOne("User", "memberships", { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user?: User;
}
