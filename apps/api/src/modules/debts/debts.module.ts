import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TransactionsModule } from "../transactions/transactions.module";
import { Debt } from "./entities/debt.entity";
import { DebtsController } from "./debts.controller";
import { DebtsService } from "./debts.service";
import { DebtsRepository } from "./debts.repository";

@Module({
  imports: [TypeOrmModule.forFeature([Debt]), TransactionsModule],
  controllers: [DebtsController],
  providers: [DebtsService, DebtsRepository],
  exports: [DebtsService],
})
export class DebtsModule {}
