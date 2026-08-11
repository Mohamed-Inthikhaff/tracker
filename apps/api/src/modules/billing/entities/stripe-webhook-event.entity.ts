import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
} from "typeorm";

/**
 * Stripe webhook idempotency ledger (FR-BILL-003 / NFR-SEC-004).
 * Primary key = Stripe event id — insert-once semantics.
 */
@Entity({ name: "stripe_webhook_events" })
export class StripeWebhookEvent {
  @PrimaryColumn({ type: "varchar", length: 128 })
  id!: string;

  @Column({ type: "varchar", length: 80 })
  type!: string;

  @CreateDateColumn({ name: "processed_at", type: "timestamptz" })
  processedAt!: Date;
}
