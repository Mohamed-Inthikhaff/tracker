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
} from "@nestjs/common";
import { CurrentHousehold } from "../../common/decorators/current-household.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { SkipHouseholdScope } from "../../common/decorators/skip-household-scope.decorator";
import type { JwtUserClaims } from "../../common/interfaces/authenticated-request.interface";
import {
  AcceptInviteDto,
  BootstrapHouseholdDto,
  CreateHouseholdDto,
  InviteMemberDto,
  UpdateHouseholdDto,
} from "./dto/household.dto";
import { HouseholdsService } from "./households.service";

@Controller("households")
export class HouseholdsController {
  constructor(private readonly households: HouseholdsService) {}

  /** FR-AUTH-002 — create default household for a newly authenticated user. */
  @SkipHouseholdScope()
  @Post("bootstrap")
  bootstrap(
    @CurrentUser() user: JwtUserClaims,
    @Body() body: BootstrapHouseholdDto
  ) {
    return this.households.createDefaultOnRegistration(user.userId, body);
  }

  /** FR-AUTH-005 — list households the user may switch into. */
  @SkipHouseholdScope()
  @Get()
  listMine(@CurrentUser() user: JwtUserClaims) {
    return this.households.listMyHouseholds(user.userId);
  }

  @SkipHouseholdScope()
  @Post()
  create(
    @CurrentUser() user: JwtUserClaims,
    @Body() body: CreateHouseholdDto
  ) {
    return this.households.createHousehold(user.userId, body);
  }

  /** FR-AUTH-003 — accept invite (no household membership yet). */
  @SkipHouseholdScope()
  @Post("invites/accept")
  acceptInvite(
    @CurrentUser() user: JwtUserClaims,
    @Body() body: AcceptInviteDto
  ) {
    return this.households.acceptInvite(user.userId, user.email, body.token);
  }

  @Get("current")
  getCurrent(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims
  ) {
    return this.households.getHousehold(householdId, user.userId);
  }

  @Patch("current")
  updateCurrent(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims,
    @Body() body: UpdateHouseholdDto
  ) {
    return this.households.updateHousehold(householdId, user.userId, body);
  }

  @Delete("current")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeCurrent(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims
  ) {
    return this.households.removeHousehold(householdId, user.userId);
  }

  @Get("current/members")
  listMembers(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims
  ) {
    return this.households.listMembers(householdId, user.userId);
  }

  @Post("current/invites")
  invite(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims,
    @Body() body: InviteMemberDto
  ) {
    return this.households.inviteMember(householdId, user.userId, body);
  }

  @Delete("current/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims,
    @Param("userId", ParseUUIDPipe) targetUserId: string
  ) {
    return this.households.removeMember(
      householdId,
      user.userId,
      targetUserId
    );
  }
}
