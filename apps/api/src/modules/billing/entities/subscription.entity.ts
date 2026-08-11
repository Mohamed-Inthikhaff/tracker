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
import type {
  BillingCycle,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@expense-tracker/types";
import type { Household } from "../../households/entities/household.entity";

/**
 * Household subscription state (feasibility SUBSCRIPTIONS).
 * Plan/status driven by Stripe webhooks; free is the default row.
 */
@Entity({ name: "subscriptions" })
@Index(["householdId"], { unique: true })
@Index(["stripeCustomerId"])
@Index(["stripeSubscriptionId"])
export class Subscription {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "household_id", type: "uuid", unique: true })
  householdId!: string;

  @Column({ name: "stripe_customer_id", type: "varchar", length: 64, nullable: true })
  stripeCustomerId!: string | null;

  @Column({
    name: "stripe_subscription_id",
    type: "varchar",
    length: 64,
    nullable: true,
  })
  stripeSubscriptionId!: string | null;

  @Column({ type: "varchar", length: 16, default: "free" })
  plan!: SubscriptionPlan;

  @Column({ type: "varchar", length: 16, default: "free" })
  status!: SubscriptionStatus;

  @Column({ name: "billing_cycle", type: "varchar", length: 16, nullable: true })
  billingCycle!: BillingCycle | null;

  @Column({
    name: "current_period_end",
    type: "timestamptz",
    nullable: true,
  })
  currentPeriodEnd!: Date | null;

  @Column({ name: "cancel_at_period_end", type: "boolean", default: false })
  cancelAtPeriodEnd!: boolean;

  /** FR-BILL-004 — last invoice payment outcome for UI / dunning. */
  @Column({
    name: "last_payment_status",
    type: "varchar",
    length: 16,
    nullable: true,
  })
  lastPaymentStatus!: "ok" | "failed" | null;

  /** OCR usage window month YYYY-MM (FR-BILL-007). */
  @Column({ name: "ocr_usage_month", type: "char", length: 7, nullable: true })
  ocrUsageMonth!: string | null;

  @Column({ name: "ocr_usage_count", type: "int", default: 0 })
  ocrUsageCount!: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @ManyToOne("Household", { onDelete: "CASCADE" })
  @JoinColumn({ name: "household_id" })
  household?: Household;
}
