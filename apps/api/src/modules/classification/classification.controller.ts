import { Body, Controller, Post } from "@nestjs/common";
import { CurrentHousehold } from "../../common/decorators/current-household.decorator";
import {
  RecordClassificationFeedbackDto,
  SuggestCategoryDto,
} from "./dto/classification.dto";
import { ClassificationService } from "./classification.service";

@Controller("classification")
export class ClassificationController {
  constructor(private readonly classification: ClassificationService) {}

  /** FR-CAT-003–005 — suggest category + confidence (+ alternatives). */
  @Post("suggest")
  suggest(
    @CurrentHousehold() householdId: string,
    @Body() body: SuggestCategoryDto
  ) {
    return this.classification.suggest(householdId, body);
  }

  /** FR-CAT-006 — log accept/override for household few-shot context. */
  @Post("feedback")
  feedback(
    @CurrentHousehold() householdId: string,
    @Body() body: RecordClassificationFeedbackDto
  ) {
    return this.classification.recordFeedback(householdId, body);
  }
}
