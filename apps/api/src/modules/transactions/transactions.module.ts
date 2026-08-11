import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriesModule } from "../categories/categories.module";
import { HouseholdsModule } from "../households/households.module";
import { ClassificationModule } from "../classification/classification.module";
import { BillingModule } from "../billing/billing.module";
import { Transaction } from "./entities/transaction.entity";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { TransactionsRepository } from "./transactions.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction]),
    CategoriesModule,
    HouseholdsModule,
    ClassificationModule,
    forwardRef(() => BillingModule),
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionsRepository],
  exports: [TransactionsService, TransactionsRepository],
})
export class TransactionsModule {}
