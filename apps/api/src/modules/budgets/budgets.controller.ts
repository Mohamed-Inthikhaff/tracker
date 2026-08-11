import { Body, Controller, Get, Post, Put, Query } from "@nestjs/common";
import { CurrentHousehold } from "../../common/decorators/current-household.decorator";
import {
  CopyBudgetMonthDto,
  ListBudgetsQueryDto,
  SetBudgetDto,
} from "./dto/budget.dto";
import { BudgetsService } from "./budgets.service";

@Controller("budgets")
export class BudgetsController {
  constructor(private readonly budgets: BudgetsService) {}

  /** FR-BUD-002–005 — budget vs actual for a month (live totals). */
  @Get()
  getMonth(
    @CurrentHousehold() householdId: string,
    @Query() query: ListBudgetsQueryDto
  ) {
    return this.budgets.getMonth(householdId, query.month);
  }

  /** FR-BUD-001 — upsert category monthly budget. */
  @Put()
  set(
    @CurrentHousehold() householdId: string,
    @Body() body: SetBudgetDto
  ) {
    return this.budgets.set(householdId, body);
  }

  /** FR-BUD-006 — copy prior month as starting point. */
  @Post("copy")
  copy(
    @CurrentHousehold() householdId: string,
    @Body() body: CopyBudgetMonthDto
  ) {
    return this.budgets.copyMonth(householdId, body);
  }
}
