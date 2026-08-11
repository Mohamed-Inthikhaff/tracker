import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import type { CategoryType } from "@expense-tracker/types";
import { CurrentHousehold } from "../../common/decorators/current-household.decorator";
import {
  CreateCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from "./dto/category.dto";
import { CategoriesService } from "./categories.service";

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list(
    @CurrentHousehold() householdId: string,
    @Query("includeInactive") includeInactive?: string,
    @Query("type") type?: CategoryType
  ) {
    return this.categories.list(householdId, {
      includeInactive: includeInactive === "true",
      type,
    });
  }

  @Post()
  create(
    @CurrentHousehold() householdId: string,
    @Body() body: CreateCategoryDto
  ) {
    return this.categories.create(householdId, body);
  }

  /** Must be registered before `:id` routes so "reorder" is not parsed as an id. */
  @Post("reorder")
  reorder(
    @CurrentHousehold() householdId: string,
    @Body() body: ReorderCategoriesDto
  ) {
    return this.categories.reorder(householdId, body);
  }

  @Get(":id")
  getOne(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.categories.getById(householdId, id);
  }

  @Patch(":id")
  update(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: UpdateCategoryDto
  ) {
    return this.categories.update(householdId, id, body);
  }

  @Post(":id/deactivate")
  @HttpCode(HttpStatus.OK)
  deactivate(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.categories.deactivate(householdId, id);
  }

  @Post(":id/activate")
  @HttpCode(HttpStatus.OK)
  activate(
    @CurrentHousehold() householdId: string,
    @Param("id", ParseUUIDPipe) id: string
  ) {
    return this.categories.activate(householdId, id);
  }
}
