# `apps/api/src/common` — cross-cutting API infrastructure

Use these pieces on every feature module. Do **not** re-implement household
scoping, validation, or error shaping inside controllers or services.

## What each piece does

| Piece | File | Role |
|-------|------|------|
| **AuthGuard** | `guards/auth.guard.ts` | Reads `Authorization: Bearer <jwt>`, verifies the token with `JWT_SECRET`, and attaches `request.user` (`userId`, `activeHouseholdId`, `householdIds`). |
| **HouseholdScopeGuard** | `guards/household-scope.guard.ts` | Resolves active household (`X-Household-Id` or JWT `activeHouseholdId` hint), then verifies **live** `household_members` membership. JWT `householdIds` is never the access-control source of truth (FR-AUTH-007 / FR-AUTH-006). |
| **@CurrentHousehold()** | `decorators/current-household.decorator.ts` | Controller param decorator — inject the resolved household id. Preferred over reading `req` manually. |
| **@CurrentUser()** | `decorators/current-user.decorator.ts` | Controller param decorator — inject JWT user claims. |
| **@Public()** | `decorators/public.decorator.ts` | Skip both guards (health checks). |
| **@SkipHouseholdScope()** | `decorators/skip-household-scope.decorator.ts` | Auth required, but no active household (bootstrap, list mine, invite accept). |
| **HouseholdContextInterceptor** | `interceptors/household-context.interceptor.ts` | Copies household + user into AsyncLocalStorage after guards run, so deep service code can call `getHouseholdContext()` if needed. |
| **ZodValidationPipe** | `pipes/zod-validation.pipe.ts` | Global nestjs-zod pipe. DTOs use `createZodDto(schema)` with schemas from `packages/types` — never redefine Zod schemas in api vs web. |
| **HttpExceptionFilter** | `filters/http-exception.filter.ts` | Global JSON error shape for HttpException, Zod validation errors, and unexpected failures. |

## Expected JWT claims (until auth module issues real tokens)

```json
{
  "sub": "<auth0Sub>",
  "email": "optional@example.com",
  "activeHouseholdId": "<uuid>",
  "householdIds": ["<uuid>", "..."]
}
```

Signed with HS256 using env `JWT_SECRET`. `activeHouseholdId` / `householdIds` are optional hints for the client. After bootstrap, a token without those claims still works: send `X-Household-Id` and the guard checks `household_members`.

## Controller usage

```ts
@Get()
list(
  @CurrentHousehold() householdId: string,
  @CurrentUser() user: JwtUserClaims,
) {
  return this.service.list(householdId, user.userId);
}
```

Apply `@Public()` only when a route must work without a household context
(e.g. health, accepting an invite). All other routes inherit the global guards.

## Order of execution (global)

1. `AuthGuard` → `request.user`
2. `HouseholdScopeGuard` → `request.householdId`
3. `ZodValidationPipe` → validated DTO
4. `HouseholdContextInterceptor` → ALS store
5. Controller / service
6. `HttpExceptionFilter` on any thrown error
