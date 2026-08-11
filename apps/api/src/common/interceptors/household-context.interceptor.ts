import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import type { AuthenticatedRequest } from "../interfaces/authenticated-request.interface";
import {
  householdContext,
  type HouseholdContextStore,
} from "../context/household-context";

/**
 * Copies the guard-resolved household (+ user) into AsyncLocalStorage so
 * deeper services can read tenant context without threading ids through
 * every method signature. Prefer @CurrentHousehold() in controllers first.
 */
@Injectable()
export class HouseholdContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.householdId || !request.user) {
      return next.handle();
    }

    const store: HouseholdContextStore = {
      householdId: request.householdId,
      userId: request.user.userId,
    };

    return new Observable((subscriber) => {
      householdContext.run(store, () => {
        next.handle().subscribe({
          next: (value) => subscriber.next(value),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
