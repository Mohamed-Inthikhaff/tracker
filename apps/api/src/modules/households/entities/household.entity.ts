import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { HouseholdMember } from "./household-member.entity";
import type { HouseholdInvite } from "./household-invite.entity";

@Entity({ name: "households" })
export class Household {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120 })
  name!: string;

  @Column({ name: "base_currency", type: "char", length: 3, default: "USD" })
  baseCurrency!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @Column({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;

  @OneToMany("HouseholdMember", "household")
  members?: HouseholdMember[];

  @OneToMany("HouseholdInvite", "household")
  invites?: HouseholdInvite[];
}
