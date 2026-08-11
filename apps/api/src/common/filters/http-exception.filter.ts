import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Response } from "express";
import { ZodValidationException } from "nestjs-zod";
import { ZodError } from "zod";

interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path?: string;
  timestamp: string;
}

/**
 * Global exception filter — consistent JSON for HttpException, Zod, and
 * unexpected errors (no stack traces leaked to clients).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ url?: string }>();

    const body = this.toBody(exception, request.url);
    if (body.statusCode >= 500) {
      this.logger.error(exception);
    }
    response.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown, path?: string): ErrorBody {
    const timestamp = new Date().toISOString();

    if (exception instanceof ZodValidationException) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: "Bad Request",
        message: formatUnknownZodError(exception.getZodError()),
        path,
        timestamp,
      };
    }

    if (exception instanceof ZodError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        error: "Bad Request",
        message: formatZodError(exception),
        path,
        timestamp,
      };
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message =
        typeof res === "string"
          ? res
          : typeof res === "object" && res !== null && "message" in res
            ? (res as { message: string | string[] }).message
            : exception.message;
      const error =
        typeof res === "object" && res !== null && "error" in res
          ? String((res as { error: string }).error)
          : exception.name;
      return { statusCode: status, error, message, path, timestamp };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "Internal Server Error",
      message: "An unexpected error occurred",
      path,
      timestamp,
    };
  }
}

function formatUnknownZodError(error: unknown): string | string[] {
  if (error instanceof ZodError) {
    return formatZodError(error);
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "issues" in error &&
    Array.isArray((error as { issues: unknown }).issues)
  ) {
    return formatZodError(error as ZodError);
  }
  return "Validation failed";
}

function formatZodError(error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length ? issue.path.join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
}
