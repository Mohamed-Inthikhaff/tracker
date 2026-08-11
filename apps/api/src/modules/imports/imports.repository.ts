import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import type { CategoryRemap, ColumnMapping } from "@expense-tracker/types";
import { ImportBatch, type ImportBatchStatus } from "./entities/import-batch.entity";

@Injectable()
export class ImportsRepository {
  constructor(
    @InjectRepository(ImportBatch)
    private readonly batches: Repository<ImportBatch>
  ) {}

  create(data: {
    householdId: string;
    createdByUserId: string;
    filename: string | null;
    headers: string[];
    rows: Array<Record<string, string>>;
    suggestedMapping: ColumnMapping;
  }): Promise<ImportBatch> {
    return this.batches.save(
      this.batches.create({
        ...data,
        status: "uploaded",
        mapping: null,
        categoryRemaps: null,
        previewSummary: null,
        committedCount: 0,
      })
    );
  }

  findById(householdId: string, id: string): Promise<ImportBatch | null> {
    return this.batches.findOne({ where: { id, householdId } });
  }

  save(batch: ImportBatch): Promise<ImportBatch> {
    return this.batches.save(batch);
  }

  async updatePreview(
    id: string,
    data: {
      mapping: ColumnMapping;
      categoryRemaps: CategoryRemap[];
      previewSummary: Record<string, unknown>;
      status: ImportBatchStatus;
    }
  ): Promise<void> {
    await this.batches.update(
      { id },
      {
        mapping: data.mapping,
        categoryRemaps: data.categoryRemaps,
        previewSummary: data.previewSummary as object,
        status: data.status,
      }
    );
  }

  async markCommitted(id: string, committedCount: number): Promise<void> {
    await this.batches.update(
      { id },
      { status: "committed", committedCount }
    );
  }
}
