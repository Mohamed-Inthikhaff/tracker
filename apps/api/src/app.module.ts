import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from "@nestjs/core";
import { AuthGuard } from "./common/guards/auth.guard";
import { HouseholdScopeGuard } from "./common/guards/household-scope.guard";
import { HouseholdContextInterceptor } from "./common/interceptors/household-context.interceptor";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { ZodValidationPipe } from "./common/pipes/zod-validation.pipe";
import { HealthController } from "./health.controller";

/**
 * Root Nest module. Feature modules (auth, households, transactions, …)
 * are added in later Phase 0 prompts — not here.
 *
 * Cross-cutting concerns (common/) are registered globally via APP_* tokens.
 */
@Module({
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: HouseholdScopeGuard },
    { provide: APP_INTERCEPTOR, useClass: HouseholdContextInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
  ],
})
export class AppModule {}
