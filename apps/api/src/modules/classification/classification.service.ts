import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type {
  RecordClassificationFeedbackInput,
  SuggestCategoryInput,
  TransactionType,
} from "@expense-tracker/types";
import { CategoriesService } from "../categories/categories.service";
import { ClassificationRepository } from "./classification.repository";
import {
  LLM_CLASSIFICATION_CLIENT,
  type CategorySuggestion,
  type LlmClassificationClient,
} from "./interfaces/classification.interface";

@Injectable()
export class ClassificationService {
  constructor(
    private readonly repo: ClassificationRepository,
    private readonly categories: CategoriesService,
    private readonly config: ConfigService,
    @Inject(LLM_CLASSIFICATION_CLIENT)
    private readonly llm: LlmClassificationClient
  ) {}

  /**
   * FR-CAT-003 — suggest a category for a description.
   * Public method called by transactions.service (not the Gemini SDK).
   */
  async suggestCategory(
    householdId: string,
    description: string,
    typeHint?: TransactionType
  ): Promise<CategorySuggestion> {
    const trimmed = description.trim();
    if (!trimmed) {
      throw new BadRequestException("Description is required for suggestion");
    }

    const all = await this.categories.list(householdId, {
      includeInactive: false,
      type: typeHint,
    });
    if (all.length === 0) {
      throw new BadRequestException("No active categories for this household");
    }

    const fewShotLimit =
      this.config.get<number>("gemini.fewShotLimit") ?? 8;
    const threshold =
      this.config.get<number>("gemini.highConfidenceThreshold") ?? 0.85;
    const model =
      this.config.get<string>("gemini.model") ?? "gemini-2.5-flash-lite";

    const examples = await this.repo.findRecentExamples(
      householdId,
      fewShotLimit
    );

    try {
      const result = await this.llm.suggest({
        description: trimmed,
        categories: all.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
        })),
        fewShot: examples.map((ex) => ({
          description: ex.description,
          categoryId: ex.categoryId,
          categoryName: ex.category?.name ?? ex.categoryId,
        })),
      });

      return {
        categoryId: result.categoryId,
        confidence: result.confidence,
        highConfidence: result.confidence >= threshold,
        alternatives: result.alternatives.slice(0, 2),
        model,
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Classification provider error";
      throw new ServiceUnavailableException(
        `Category suggestion unavailable: ${message}`
      );
    }
  }

  /** Convenience DTO-shaped entry for the controller. */
  suggest(
    householdId: string,
    input: SuggestCategoryInput
  ): Promise<CategorySuggestion> {
    return this.suggestCategory(householdId, input.description, input.type);
  }

  /**
   * FR-CAT-006 — store accept/override for household few-shot memory.
   */
  async recordFeedback(
    householdId: string,
    input: RecordClassificationFeedbackInput
  ): Promise<{ id: string }> {
    await this.categories.getById(householdId, input.categoryId);
    const saved = await this.repo.createExample({
      householdId,
      description: input.description.trim(),
      categoryId: input.categoryId,
      userAccepted: input.accepted,
      suggestedCategoryId: input.suggestedCategoryId ?? null,
    });
    return { id: saved.id };
  }
}
