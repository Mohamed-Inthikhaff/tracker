import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriesModule } from "../categories/categories.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { Budget } from "./entities/budget.entity";
import { BudgetsController } from "./budgets.controller";
import { BudgetsService } from "./budgets.service";
import { BudgetsRepository } from "./budgets.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([Budget]),
    CategoriesModule,
    TransactionsModule,
  ],
  controllers: [BudgetsController],
  providers: [BudgetsService, BudgetsRepository],
  exports: [BudgetsService],
})
export class BudgetsModule {}
