import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { GoogleGenAI } from "@google/genai";
import type {
  GeminiSuggestRequest,
  LlmClassificationClient,
} from "./interfaces/classification.interface";

/**
 * Only file that talks to the Gemini API.
 * classification.service.ts consumes LlmClassificationClient — not this SDK.
 */
@Injectable()
export class GeminiClassificationClient implements LlmClassificationClient {
  private readonly logger = new Logger(GeminiClassificationClient.name);
  private readonly client: GoogleGenAI | null;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("gemini.apiKey") ?? "";
    this.model =
      this.config.get<string>("gemini.model") ?? "gemini-2.5-flash-lite";
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  async suggest(request: GeminiSuggestRequest): Promise<{
    categoryId: string;
    confidence: number;
    alternatives: Array<{ categoryId: string; confidence: number }>;
  }> {
    if (!this.client) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = buildPrompt(request);
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() ?? "";
    if (!text) {
      this.logger.warn("Empty Gemini classification response");
      throw new Error("Empty classification response from Gemini");
    }

    return parseModelJson(text, request.categories.map((c) => c.id));
  }
}

function buildPrompt(request: GeminiSuggestRequest): string {
  const categories = request.categories
    .map((c) => `- id=${c.id} | type=${c.type} | name=${c.name}`)
    .join("\n");

  const fewShot =
    request.fewShot.length === 0
      ? "(none yet)"
      : request.fewShot
          .map(
            (ex, i) =>
              `${i + 1}. description="${ex.description}" → categoryId=${ex.categoryId} (${ex.categoryName})`
          )
          .join("\n");

  return `You classify personal-finance transactions into a household category.

Return ONLY valid JSON matching:
{"categoryId":"<uuid from the list>","confidence":0.0-1.0,"alternatives":[{"categoryId":"<uuid>","confidence":0.0-1.0}]}

Rules:
- categoryId MUST be one of the listed ids.
- confidence is your certainty 0..1.
- alternatives: up to 2 other candidates from the list, lower confidence, no duplicates of the primary.
- Prefer household examples when description is similar.

Household categories:
${categories}

Recent confirmed examples from this household (few-shot):
${fewShot}

New description to classify:
"""${request.description}"""`;
}

function parseModelJson(
  text: string,
  validIds: string[]
): {
  categoryId: string;
  confidence: number;
  alternatives: Array<{ categoryId: string; confidence: number }>;
} {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as {
    categoryId?: string;
    confidence?: number;
    alternatives?: Array<{ categoryId?: string; confidence?: number }>;
  };

  const categoryId = parsed.categoryId;
  if (!categoryId || !validIds.includes(categoryId)) {
    throw new Error("Gemini returned an unknown or missing categoryId");
  }

  const confidence = clamp01(Number(parsed.confidence ?? 0));
  const alternatives = (parsed.alternatives ?? [])
    .filter(
      (a): a is { categoryId: string; confidence: number } =>
        Boolean(a.categoryId) && validIds.includes(a.categoryId!)
    )
    .filter((a) => a.categoryId !== categoryId)
    .slice(0, 2)
    .map((a) => ({
      categoryId: a.categoryId,
      confidence: clamp01(Number(a.confidence ?? 0)),
    }));

  return { categoryId, confidence, alternatives };
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
