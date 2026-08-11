import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from "@nestjs/common";
import { CurrentHousehold } from "../../common/decorators/current-household.decorator";
import { CreateDebtDto, UpdateDebtDto } from "./dto/debt.dto";
import { DebtsService } from "./debts.service";

@Controller("debts")
export class DebtsController {
  constructor(private readonly debts: DebtsService) {}

  /** FR-DEBT-007 — list + household owed aggregates. */
  @Get()
  list(@CurrentHousehold() householdId: string) {
    return this.debts.listWithTotals(householdId);
  }

  @Post()
  create(
    @CurrentHousehold() householdId: string,
    @Body() body: CreateDebtDto
  ) {
    return this.debts.create(householdId, body);
  }

  @Get(":id")
  getOne(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.debts.getById(householdId, id);
  }

  @Patch(":id")
  update(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateDebtDto
  ) {
    return this.debts.update(householdId, id, body);
  }
}
