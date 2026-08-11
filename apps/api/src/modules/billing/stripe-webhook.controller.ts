import {
  Controller,
  Headers,
  HttpCode,
  Post,
  Req,
  type RawBodyRequest,
} from "@nestjs/common";
import type { Request } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { StripeWebhookService } from "./stripe-webhook.service";

@Controller("billing/webhooks")
export class StripeWebhookController {
  constructor(private readonly webhooks: StripeWebhookService) {}

  /**
   * FR-BILL-003 / NFR-SEC-004 — signature verified + idempotent.
   * Requires Nest rawBody (see main.ts).
   */
  @Public()
  @Post("stripe")
  @HttpCode(200)
  handleStripe(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string | undefined
  ) {
    const raw = req.rawBody;
    if (!raw) {
      // Nest only sets rawBody when factory is created with { rawBody: true }
      throw new Error("rawBody missing — enable NestFactory rawBody: true");
    }
    return this.webhooks.handleRawEvent(raw, signature);
  }
}
