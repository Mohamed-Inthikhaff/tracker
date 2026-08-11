import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HouseholdsModule } from "../households/households.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { Subscription } from "./entities/subscription.entity";
import { StripeWebhookEvent } from "./entities/stripe-webhook-event.entity";
import { BillingController } from "./billing.controller";
import { StripeWebhookController } from "./stripe-webhook.controller";
import { BillingService } from "./billing.service";
import { BillingLimitsService } from "./billing-limits.service";
import { StripeWebhookService } from "./stripe-webhook.service";
import { BillingRepository } from "./billing.repository";
import { StripeClient } from "./stripe.client";

@Module({
  imports: [
    TypeOrmModule.forFeature([Subscription, StripeWebhookEvent]),
    HouseholdsModule,
    forwardRef(() => TransactionsModule),
  ],
  controllers: [BillingController, StripeWebhookController],
  providers: [
    BillingService,
    BillingLimitsService,
    StripeWebhookService,
    BillingRepository,
    StripeClient,
  ],
  exports: [BillingService],
})
export class BillingModule {}
