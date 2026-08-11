import type { TransactionType } from "@expense-tracker/types";

export interface CategoryOption {
  id: string;
  name: string;
  type: TransactionType;
}

export interface CategorySuggestion {
  categoryId: string;
  confidence: number;
  /** FR-CAT-004 — true when confidence >= household/high threshold. */
  highConfidence: boolean;
  /** FR-CAT-005 — alternative suggestions when not high confidence. */
  alternatives: Array<{ categoryId: string; confidence: number }>;
  model: string;
}

export interface GeminiSuggestRequest {
  description: string;
  categories: CategoryOption[];
  fewShot: Array<{
    description: string;
    categoryId: string;
    categoryName: string;
  }>;
}

/** Isolate provider SDK behind this port so tests mock without network. */
export interface LlmClassificationClient {
  suggest(request: GeminiSuggestRequest): Promise<{
    categoryId: string;
    confidence: number;
    alternatives: Array<{ categoryId: string; confidence: number }>;
  }>;
}

export const LLM_CLASSIFICATION_CLIENT = Symbol("LLM_CLASSIFICATION_CLIENT");
