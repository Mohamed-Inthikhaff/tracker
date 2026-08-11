import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CategoriesModule } from "../categories/categories.module";
import { ClassificationExample } from "./entities/classification-example.entity";
import { ClassificationController } from "./classification.controller";
import { ClassificationService } from "./classification.service";
import { ClassificationRepository } from "./classification.repository";
import { GeminiClassificationClient } from "./gemini-classification.client";
import { LLM_CLASSIFICATION_CLIENT } from "./interfaces/classification.interface";

@Module({
  imports: [
    TypeOrmModule.forFeature([ClassificationExample]),
    CategoriesModule,
  ],
  controllers: [ClassificationController],
  providers: [
    ClassificationService,
    ClassificationRepository,
    GeminiClassificationClient,
    {
      provide: LLM_CLASSIFICATION_CLIENT,
      useExisting: GeminiClassificationClient,
    },
  ],
  exports: [ClassificationService],
})
export class ClassificationModule {}
