import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import type { Household } from "../../households/entities/household.entity";
import type { Category } from "../../categories/entities/category.entity";

/**
 * Household-specific AI accept/override examples (FR-CAT-006).
 * Fed back into the Gemini prompt as few-shot context.
 */
@Entity({ name: "classification_examples" })
@Index(["householdId", "createdAt"])
export class ClassificationExample {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "household_id", type: "uuid" })
  householdId!: string;

  @Column({ type: "varchar", length: 280 })
  description!: string;

  @Column({ name: "category_id", type: "uuid" })
  categoryId!: string;

  /** true when user confirmed AI; false when they overrode. */
  @Column({ name: "user_accepted", type: "boolean" })
  userAccepted!: boolean;

  @Column({ name: "suggested_category_id", type: "uuid", nullable: true })
  suggestedCategoryId!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ManyToOne("Household", { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household?: Household;

  @ManyToOne("Category", { onDelete: "CASCADE" })
  @JoinColumn({ name: "category_id" })
  category?: Category;
}
