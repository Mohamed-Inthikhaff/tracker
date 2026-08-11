import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import type { CategoryRemap, ColumnMapping } from "@expense-tracker/types";
import type { Household } from "../../households/entities/household.entity";
import type { User } from "../../households/entities/user.entity";

export type ImportBatchStatus =
  | "uploaded"
  | "previewed"
  | "committed"
  | "failed";

@Entity({ name: "import_batches" })
export class ImportBatch {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "household_id", type: "uuid" })
  householdId!: string;

  @Column({ name: "created_by_user_id", type: "uuid" })
  createdByUserId!: string;

  @Column({ type: "varchar", length: 32, default: "uploaded" })
  status!: ImportBatchStatus;

  @Column({ type: "varchar", length: 255, nullable: true })
  filename!: string | null;

  @Column({ type: "jsonb" })
  headers!: string[];

  /** Raw row objects keyed by original CSV header. */
  @Column({ type: "jsonb" })
  rows!: Array<Record<string, string>>;

  @Column({ name: "suggested_mapping", type: "jsonb" })
  suggestedMapping!: ColumnMapping;

  @Column({ type: "jsonb", nullable: true })
  mapping!: ColumnMapping | null;

  @Column({ name: "category_remaps", type: "jsonb", nullable: true })
  categoryRemaps!: CategoryRemap[] | null;

  @Column({ name: "preview_summary", type: "jsonb", nullable: true })
  previewSummary!: Record<string, unknown> | null;

  @Column({ name: "committed_count", type: "int", default: 0 })
  committedCount!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne("Household", { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household?: Household;

  @ManyToOne("User", { onDelete: "RESTRICT" })
  @JoinColumn({ name: "created_by_user_id" })
  createdBy?: User;
}
