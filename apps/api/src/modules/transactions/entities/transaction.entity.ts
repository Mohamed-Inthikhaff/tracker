import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type {
  TransactionSource,
  TransactionType,
} from "@expense-tracker/types";
import type { Household } from "../../households/entities/household.entity";
import type { User } from "../../households/entities/user.entity";
import type { Category } from "../../categories/entities/category.entity";

/**
 * Core money-movement record (FR-TXN-*).
 * amount is numeric(14,2) — never float (FR-TXN-006).
 */
@Entity({ name: "transactions" })
@Index(["householdId", "txnDate"])
@Index(["householdId", "type"])
@Index(["householdId", "categoryId"])
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "household_id", type: "uuid" })
  householdId!: string;

  @Column({ name: "category_id", type: "uuid" })
  categoryId!: string;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  /** Business date of the transaction (not created_at). */
  @Column({ name: "txn_date", type: "date" })
  txnDate!: string;

  @Column({ type: "varchar", length: 32 })
  type!: TransactionType;

  /**
   * Fixed-point money. TypeORM returns numeric as string from pg —
   * keep it as string end-to-end to avoid float errors.
   */
  @Column({
    type: "numeric",
    precision: 14,
    scale: 2,
    transformer: {
      to: (value: string) => value,
      from: (value: string | number | null) =>
        value === null || value === undefined ? value : String(value),
    },
  })
  amount!: string;

  @Column({ type: "char", length: 3, default: "USD" })
  currency!: string;

  @Column({ type: "varchar", length: 280, nullable: true })
  description!: string | null;

  @Column({ type: "varchar", length: 120, nullable: true })
  payee!: string | null;

  @Column({ type: "varchar", length: 1000, nullable: true })
  notes!: string | null;

  @Column({ type: "varchar", length: 32 })
  source!: TransactionSource;

  /** Reserved for Phase 1 classification; null in Phase 0. */
  @Column({
    name: "ai_confidence",
    type: "numeric",
    precision: 4,
    scale: 3,
    nullable: true,
  })
  aiConfidence!: string | null;

  @Column({ name: "user_confirmed_category", type: "boolean", default: true })
  userConfirmedCategory!: boolean;

  /** Immutable creation timestamp (FR-TXN-004). */
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne("Household", { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household?: Household;

  @ManyToOne("Category", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "category_id" })
  category?: Category;

  @ManyToOne("User", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "created_by_user_id" })
  createdBy?: User;
}
