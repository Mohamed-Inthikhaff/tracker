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
import type { DebtDirection } from "@expense-tracker/types";
import type { Household } from "../../households/entities/household.entity";

/**
 * Informal debt ledger row (FR-DEBT-*).
 * status / repaid / remaining are computed from transactions — not stored.
 */
@Entity({ name: "debts" })
@Index(["householdId", "personName", "direction", "openedDate"])
export class Debt {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "household_id", type: "uuid" })
  householdId!: string;

  @Column({ name: "person_name", type: "varchar", length: 120 })
  personName!: string;

  /** IOwe | OwedToMe (FR-DEBT-001). */
  @Column({ type: "varchar", length: 16 })
  direction!: DebtDirection;

  @Column({
    name: "principal_amount",
    type: "numeric",
    precision: 14,
    scale: 2,
    transformer: {
      to: (value: string) => value,
      from: (value: string | number | null) =>
        value === null || value === undefined ? value : String(value),
    },
  })
  principalAmount!: string;

  /** Business open date YYYY-MM-DD — starts the active window (FR-DEBT-004). */
  @Column({ name: "opened_date", type: "date" })
  openedDate!: string;

  @Column({ type: "varchar", length: 1000, nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne("Household", { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household?: Household;
}
