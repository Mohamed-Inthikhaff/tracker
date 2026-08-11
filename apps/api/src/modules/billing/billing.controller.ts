import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";
import { CurrentHousehold } from "../../common/decorators/current-household.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { JwtUserClaims } from "../../common/interfaces/authenticated-request.interface";
import {
  CreateBillingPortalDto,
  CreateCheckoutSessionDto,
} from "./dto/billing.dto";
import { BillingService } from "./billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /** FR-BILL-001 / FR-BILL-004 — plan, status, usage. */
  @Get("status")
  status(@CurrentHousehold() householdId: string) {
    return this.billing.getStatus(householdId);
  }

  /** FR-BILL-002 — start Stripe Checkout (Owner). */
  @Post("checkout-session")
  checkout(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims,
    @Body() body: CreateCheckoutSessionDto
  ) {
    return this.billing.createCheckoutSession(
      householdId,
      user.userId,
      body
    );
  }

  @Post("portal-session")
  portal(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims,
    @Body() body: CreateBillingPortalDto
  ) {
    return this.billing.createPortalSession(householdId, user.userId, body);
  }

  /** FR-BILL-005 — cancel at period end (Owner). */
  @Post("cancel")
  @HttpCode(200)
  cancel(
    @CurrentHousehold() householdId: string,
    @CurrentUser() user: JwtUserClaims
  ) {
    return this.billing.cancelSubscription(householdId, user.userId);
  }
}
