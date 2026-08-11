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

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

@Entity({ name: "household_invites" })
export class HouseholdInvite {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "household_id", type: "uuid" })
  householdId!: string;

  @Index()
  @Column({ type: "varchar", length: 320 })
  email!: string;

  @Column({ type: "varchar", length: 32 })
  role!: HouseholdRole;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 64 })
  token!: string;

  @Column({ type: "varchar", length: 32, default: "pending" })
  status!: InviteStatus;

  @Column({ name: "invited_by_user_id", type: "uuid" })
  invitedByUserId!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "accepted_by_user_id", type: "uuid", nullable: true })
  acceptedByUserId!: string | null;

  @Column({ name: "accepted_at", type: "timestamptz", nullable: true })
  acceptedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne("Household", "invites", { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household?: Household;

  @ManyToOne("User")
  @JoinColumn({ name: "invited_by_user_id" })
  invitedBy?: User;
}
