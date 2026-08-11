import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentHousehold } from "../../common/decorators/current-household.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUserClaims } from "../../common/interfaces/authenticated-request.interface";
import {
  CreateTransactionDto,
  QueryTransactionsDto,
} from "./dto/transaction.dto";
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

  @Get(":id")
  getOne(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.transactions.getById(householdId, id);
  }
}
