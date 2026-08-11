import { z } from "zod";

export const billingCycleSchema = z.enum(["monthly", "annual"]);
export type BillingCycle = z.infer<typeof billingCycleSchema>;

export const subscriptionPlanSchema = z.enum(["free", "pro"]);
export type SubscriptionPlan = z.infer<typeof subscriptionPlanSchema>;

export const subscriptionStatusSchema = z.enum([
  "free",
  "active",
  "trialing",
  "past_due",
  "canceled",
  "unpaid",
  "incomplete",
]);
export type SubscriptionStatus = z.infer<typeof subscriptionStatusSchema>;

export const createCheckoutSessionSchema = z.object({
  cycle: billingCycleSchema,
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});
export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;

export const createBillingPortalSchema = z.object({
  returnUrl: z.string().url(),
});
export type CreateBillingPortalInput = z.infer<
  typeof createBillingPortalSchema
>;
