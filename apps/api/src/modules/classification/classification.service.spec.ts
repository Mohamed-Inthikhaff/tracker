import { ClassificationService } from "./classification.service";
import type { ClassificationRepository } from "./classification.repository";
import type { CategoriesService } from "../categories/categories.service";
import type { ConfigService } from "@nestjs/config";
import type { LlmClassificationClient } from "./interfaces/classification.interface";

describe("ClassificationService", () => {
  let service: ClassificationService;
  let repo: jest.Mocked<ClassificationRepository>;
  let categories: jest.Mocked<Pick<CategoriesService, "list" | "getById">>;
  let config: jest.Mocked<Pick<ConfigService, "get">>;
  let llm: jest.Mocked<LlmClassificationClient>;

  const householdId = "33333333-3333-3333-3333-333333333333";
  const foodId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const miscId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  beforeEach(() => {
    repo = {
      findRecentExamples: jest.fn().mockResolvedValue([]),
      createExample: jest.fn().mockResolvedValue({ id: "ex-1" }),
    } as unknown as jest.Mocked<ClassificationRepository>;

    categories = {
      list: jest.fn().mockResolvedValue([
        {
          id: foodId,
          householdId,
          name: "Food",
          type: "Expense",
          parentCategoryId: null,
          isSystemDefault: true,
          isActive: true,
          sortOrder: 10,
        },
        {
          id: miscId,
          householdId,
          name: "Misc",
          type: "Expense",
          parentCategoryId: null,
          isSystemDefault: true,
          isActive: true,
          sortOrder: 20,
        },
      ]),
      getById: jest.fn().mockResolvedValue({
        id: foodId,
        householdId,
        name: "Food",
        type: "Expense",
        parentCategoryId: null,
        isSystemDefault: true,
        isActive: true,
        sortOrder: 10,
      }),
    };

    config = {
      get: jest.fn((key: string) => {
        if (key === "gemini.fewShotLimit") return 8;
        if (key === "gemini.highConfidenceThreshold") return 0.85;
        if (key === "gemini.model") return "gemini-2.5-flash-lite";
        return undefined;
      }),
    };

    llm = {
      suggest: jest.fn(),
    };

    service = new ClassificationService(
      repo,
      categories as unknown as CategoriesService,
      config as unknown as ConfigService,
      llm
    );
  });

  it("suggests a category via LLM client and marks high confidence (FR-CAT-003/004)", async () => {
    llm.suggest.mockResolvedValue({
      categoryId: foodId,
      confidence: 0.92,
      alternatives: [{ categoryId: miscId, confidence: 0.3 }],
    });

    const result = await service.suggestCategory(
      householdId,
      "grocery weekly shopping",
      "Expense"
    );

    expect(llm.suggest).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "grocery weekly shopping",
        categories: expect.arrayContaining([
          expect.objectContaining({ id: foodId, name: "Food" }),
        ]),
      })
    );
    expect(result.categoryId).toBe(foodId);
    expect(result.highConfidence).toBe(true);
    expect(result.alternatives).toHaveLength(1);
    expect(result.model).toBe("gemini-2.5-flash-lite");
  });

  it("marks low confidence when below threshold (FR-CAT-005)", async () => {
    llm.suggest.mockResolvedValue({
      categoryId: miscId,
      confidence: 0.4,
      alternatives: [
        { categoryId: foodId, confidence: 0.35 },
        { categoryId: miscId, confidence: 0.2 },
      ],
    });

    const result = await service.suggestCategory(householdId, "something odd");
    expect(result.highConfidence).toBe(false);
    expect(result.alternatives[0]?.categoryId).toBe(foodId);
  });

  it("records household feedback for few-shot (FR-CAT-006)", async () => {
    const saved = await service.recordFeedback(householdId, {
      description: "coffee shop",
      categoryId: foodId,
      accepted: false,
      suggestedCategoryId: miscId,
    });

    expect(repo.createExample).toHaveBeenCalledWith({
      householdId,
      description: "coffee shop",
      categoryId: foodId,
      userAccepted: false,
      suggestedCategoryId: miscId,
    });
    expect(saved.id).toBe("ex-1");
  });
});
