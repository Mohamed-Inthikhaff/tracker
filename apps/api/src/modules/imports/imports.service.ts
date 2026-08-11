import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type {
  CategoryRemap,
  ColumnMapping,
  CommitImportInput,
  PreviewImportInput,
} from "@expense-tracker/types";
import { CategoriesService } from "../categories/categories.service";
import { HouseholdsRepository } from "../households/households.repository";
import { TransactionsRepository } from "../transactions/transactions.repository";
import {
  parseCsv,
  rowsToRecords,
  suggestColumnMapping,
} from "./import-csv.parser";
import { buildImportPreview } from "./import-preview.builder";
import { ImportsRepository } from "./imports.repository";
import type {
  CommitImportResult,
  PreviewImportResult,
  UploadImportResult,
} from "./interfaces/import.interface";
import type { CreateTransactionData } from "../transactions/interfaces/transaction.interface";

const PREVIEW_SAMPLE = 25;

@Injectable()
export class ImportsService {
  constructor(
    private readonly repo: ImportsRepository,
    private readonly categories: CategoriesService,
    private readonly households: HouseholdsRepository,
    private readonly transactions: TransactionsRepository
  ) {}

  /**
   * FR-IMP-001 — accept CSV text, store rows, return suggested column mapping.
   */
  async upload(
    householdId: string,
    auth0Sub: string,
    csvText: string,
    filename?: string
  ): Promise<UploadImportResult> {
    const user = await this.requireUser(auth0Sub);
    const { headers, rows } = parseCsv(csvText);
    if (headers.length === 0) {
      throw new BadRequestException("CSV has no header row");
    }
    if (rows.length === 0) {
      throw new BadRequestException("CSV has no data rows");
    }

    const records = rowsToRecords(headers, rows);
    const suggested = suggestColumnMapping(headers) as ColumnMapping;

    const batch = await this.repo.create({
      householdId,
      createdByUserId: user.id,
      filename: filename ?? null,
      headers,
      rows: records,
      suggestedMapping: suggested,
    });

    return {
      id: batch.id,
      filename: batch.filename,
      headers: batch.headers,
      rowCount: batch.rows.length,
      suggestedMapping: batch.suggestedMapping,
      status: batch.status,
    };
  }

  async get(householdId: string, id: string) {
    const batch = await this.requireBatch(householdId, id);
    return {
      id: batch.id,
      filename: batch.filename,
      headers: batch.headers,
      rowCount: batch.rows.length,
      suggestedMapping: batch.suggestedMapping,
      mapping: batch.mapping,
      categoryRemaps: batch.categoryRemaps ?? [],
      previewSummary: batch.previewSummary,
      status: batch.status,
      committedCount: batch.committedCount,
    };
  }

  /**
   * FR-IMP-002 / FR-IMP-003 — map columns, remap categories, preview before commit.
   */
  async preview(
    householdId: string,
    id: string,
    input: PreviewImportInput
  ): Promise<PreviewImportResult> {
    const batch = await this.requireBatch(householdId, id);
    if (batch.status === "committed") {
      throw new BadRequestException("Import already committed");
    }

    await this.applyCreateCategoryRemaps(
      householdId,
      input.categoryRemaps ?? []
    );

    const categories = await this.categories.list(householdId, {
      includeInactive: false,
    });

    let preview;
    try {
      preview = buildImportPreview(
        batch.rows,
        input.mapping,
        categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          isActive: c.isActive,
        })),
        input.categoryRemaps ?? []
      );
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : "Invalid column mapping"
      );
    }

    const summary = {
      readyCount: preview.readyCount,
      failedCount: preview.failedCount,
      unmappedCategories: preview.unmappedCategories,
      canCommit:
        preview.unmappedCategories.length === 0 && preview.readyCount > 0,
    };

    await this.repo.updatePreview(batch.id, {
      mapping: input.mapping,
      categoryRemaps: input.categoryRemaps ?? [],
      previewSummary: summary,
      status: "previewed",
    });

    return {
      id: batch.id,
      status: "previewed",
      readyCount: preview.readyCount,
      failedCount: preview.failedCount,
      unmappedCategories: preview.unmappedCategories,
      sampleReady: preview.ready.slice(0, PREVIEW_SAMPLE),
      failed: preview.failed.slice(0, 200),
      canCommit: summary.canCommit,
    };
  }

  /**
   * FR-IMP-004 — commit ready rows with source = csv_import (no AI path).
   */
  async commit(
    householdId: string,
    auth0Sub: string,
    id: string,
    input: CommitImportInput
  ): Promise<CommitImportResult> {
    const user = await this.requireUser(auth0Sub);
    const batch = await this.requireBatch(householdId, id);
    if (batch.status === "committed") {
      throw new BadRequestException("Import already committed");
    }

    const household = await this.households.findHouseholdById(householdId);
    if (!household) {
      throw new NotFoundException("Household not found");
    }

    await this.applyCreateCategoryRemaps(
      householdId,
      input.categoryRemaps ?? []
    );

    const categories = await this.categories.list(householdId, {
      includeInactive: false,
    });

    let preview;
    try {
      preview = buildImportPreview(
        batch.rows,
        input.mapping,
        categories.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          isActive: c.isActive,
        })),
        input.categoryRemaps ?? []
      );
    } catch (err) {
      throw new BadRequestException(
        err instanceof Error ? err.message : "Invalid column mapping"
      );
    }

    if (preview.unmappedCategories.length > 0) {
      throw new BadRequestException({
        message: "Resolve unmapped categories before commit",
        unmappedCategories: preview.unmappedCategories,
      });
    }
    if (preview.readyCount === 0) {
      throw new BadRequestException("No valid rows to import");
    }

    const payload: CreateTransactionData[] = preview.ready.map((row) => ({
      householdId,
      categoryId: row.categoryId,
      createdByUserId: user.id,
      txnDate: row.date,
      type: row.type,
      amount: row.amount,
      currency: household.baseCurrency,
      description: row.description,
      payee: row.payee,
      notes: row.notes,
      source: "csv_import",
      aiConfidence: null,
      userConfirmedCategory: true,
    }));

    const created = await this.transactions.createMany(payload);
    await this.repo.markCommitted(batch.id, created.length);

    return {
      id: batch.id,
      status: "committed",
      createdCount: created.length,
      source: "csv_import",
      transactionIds: created.map((t) => t.id),
    };
  }

  /** Create categories requested via remaps (FR-IMP-002). */
  private async applyCreateCategoryRemaps(
    householdId: string,
    remaps: CategoryRemap[]
  ): Promise<void> {
    const existing = await this.categories.list(householdId, {
      includeInactive: true,
    });
    const key = (name: string, type: string) =>
      `${type}::${name.trim().toLowerCase()}`;
    const known = new Set(existing.map((c) => key(c.name, c.type)));

    for (const remap of remaps) {
      if (!remap.createCategory) continue;
      const name = (remap.newCategoryName ?? remap.sourceName).trim();
      if (known.has(key(name, remap.type))) continue;
      await this.categories.create(householdId, {
        name,
        type: remap.type,
      });
      known.add(key(name, remap.type));
    }
  }

  private async requireUser(auth0Sub: string) {
    const user = await this.households.findUserByAuth0Sub(auth0Sub);
    if (!user) {
      throw new NotFoundException(
        "User not found — complete registration bootstrap first"
      );
    }
    return user;
  }

  private async requireBatch(householdId: string, id: string) {
    const batch = await this.repo.findById(householdId, id);
    if (!batch) {
      throw new NotFoundException("Import batch not found");
    }
    return batch;
  }
}
