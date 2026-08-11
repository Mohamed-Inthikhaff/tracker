import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import type { Household } from "../../households/entities/household.entity";
import type { Category } from "../../categories/entities/category.entity";

/**
 * Monthly budget target per category (FR-BUD-001).
 * Actual/variance/health are computed on read from transactions — never cached.
 */
@Entity({ name: "budgets" })
@Unique("UQ_budgets_household_category_month", [
  "householdId",
  "categoryId",
  "month",
])
@Index(["householdId", "month"])
export class Budget {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "household_id", type: "uuid" })
  householdId!: string;

  @Column({ name: "category_id", type: "uuid" })
  categoryId!: string;

  /** YYYY-MM */
  @Column({ type: "char", length: 7 })
  month!: string;

  @Column({
    name: "budgeted_amount",
    type: "numeric",
    precision: 14,
    scale: 2,
    transformer: {
      to: (value: string) => value,
      from: (value: string | number | null) =>
        value === null || value === undefined ? value : String(value),
    },
  })
  budgetedAmount!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne("Household", { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household?: Household;

  @ManyToOne("Category", { onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category?: Category;
}
