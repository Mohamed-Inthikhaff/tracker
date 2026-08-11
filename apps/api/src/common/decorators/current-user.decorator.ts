import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type {
  AuthenticatedRequest,
  JwtUserClaims,
} from "../interfaces/authenticated-request.interface";

/** Authenticated user claims from AuthGuard. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUserClaims => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) {
      throw new Error(
        "CurrentUser() used without AuthGuard — user missing on request"
      );
    }
    return request.user;
  }
);
