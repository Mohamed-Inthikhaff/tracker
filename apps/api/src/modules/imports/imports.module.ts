import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriesModule } from "../categories/categories.module";
import { HouseholdsModule } from "../households/households.module";
import { TransactionsModule } from "../transactions/transactions.module";
import { ImportBatch } from "./entities/import-batch.entity";
import { ImportsController } from "./imports.controller";
import { ImportsService } from "./imports.service";
import { ImportsRepository } from "./imports.repository";

@Module({
  imports: [
    TypeOrmModule.forFeature([ImportBatch]),
    CategoriesModule,
    HouseholdsModule,
    TransactionsModule,
  ],
  controllers: [ImportsController],
  providers: [ImportsService, ImportsRepository],
  exports: [ImportsService],
})
export class ImportsModule {}
