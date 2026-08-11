import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { CategoryType } from "@expense-tracker/types";
import type { Household } from "../../households/entities/household.entity";

@Entity({ name: "categories" })
@Index(["householdId", "name", "type"], { unique: true })
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "household_id", type: "uuid" })
  householdId!: string;

  @Column({ type: "varchar", length: 80 })
  name!: string;

  @Column({ type: "varchar", length: 32 })
  type!: CategoryType;

  @Column({ name: "parent_category_id", type: "uuid", nullable: true })
  parentCategoryId!: string | null;

  @Column({ name: "is_system_default", type: "boolean", default: false })
  isSystemDefault!: boolean;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "sort_order", type: "int", default: 0 })
  sortOrder!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne("Household", { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household?: Household;

  @ManyToOne("Category", "children", {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "parent_category_id" })
  parent?: Category | null;

  @OneToMany("Category", "parent")
  children?: Category[];
}
