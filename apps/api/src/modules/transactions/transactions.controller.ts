import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentHousehold } from "../../common/decorators/current-household.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUserClaims } from "../../common/interfaces/authenticated-request.interface";
import {
  CreateTransactionDto,
  MonthlySummaryQueryDto,
  QueryTransactionsDto,
} from "./dto/transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";
import { TransactionsService } from "./transactions.service";

@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  create(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims,
    @Body() body: CreateTransactionDto
  ) {
    return this.transactions.create(householdId, user.userId, body);
  }

  @Get()
  list(
    @CurrentHousehold() householdId: string,
    @Query() query: QueryTransactionsDto
  ) {
    return this.transactions.list(householdId, query);
  }

  /** Phase 0 exit criterion — compare to spreadsheet Dashboard KPIs. */
  @Get("summary")
  summary(
    @CurrentHousehold() householdId: string,
    @Query() query: MonthlySummaryQueryDto
  ) {
    return this.transactions.monthlySummary(householdId, query);
  }

  @Get(":id")
  getOne(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.transactions.getById(householdId, id);
  }

  /** FR-TXN-003 — edit; household scoped via CurrentHousehold + findById. */
  @Patch(":id")
  update(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateTransactionDto
  ) {
    return this.transactions.update(householdId, id, body);
  }

  /** FR-TXN-003 — hard delete; debt remaining re-sums live (FR-DEBT-002). */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    await this.transactions.delete(householdId, id);
  }
}
