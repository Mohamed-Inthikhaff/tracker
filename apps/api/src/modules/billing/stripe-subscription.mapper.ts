import type {
  BillingCycle,
  SubscriptionStatus,
} from "@expense-tracker/types";
import type Stripe from "stripe";

export function mapStripeStatus(
  status: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return "free";
  }
}

export function periodEndDate(sub: Stripe.Subscription): Date | null {
  const end = (sub as { current_period_end?: number }).current_period_end;
  if (!end) return null;
  return new Date(end * 1000);
}

export function cycleFromSubscription(
  sub: Stripe.Subscription
): BillingCycle | null {
  const interval = sub.items.data[0]?.price?.recurring?.interval;
  if (interval === "year") return "annual";
  if (interval === "month") return "monthly";
  return null;
}

export function customerIdOf(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.id ?? null;
}
