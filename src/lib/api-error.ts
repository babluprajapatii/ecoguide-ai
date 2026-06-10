import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Standardized error codes for API responses.
 * Maps to HTTP status semantics for consistent client handling.
 */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT'
  | 'BAD_REQUEST'
  | 'INTERNAL_ERROR';

/**
 * Structured error class for API routes.
 *
 * Extends `Error` with `statusCode` and `code` fields for
 * machine-readable error responses. Stack traces are never
 * included in HTTP responses — they are logged server-side only.
 *
 * @example
 * ```ts
 * throw new ApiError('User not found', 404, 'NOT_FOUND');
 * ```
 */
export class ApiError extends Error {
  /** HTTP status code (e.g. 400, 401, 404, 429, 500). */
  public readonly statusCode: number;

  /** Machine-readable error code for client-side branching logic. */
  public readonly code: ApiErrorCode;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ApiErrorCode = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Shape of a standardized API error response body.
 * Never contains stack traces or internal implementation details.
 */
interface ApiErrorResponseBody {
  error: {
    message: string;
    code: ApiErrorCode;
    statusCode: number;
    /** Zod field-level errors, present only for validation failures. */
    details?: Record<string, string[]>;
  };
}

/**
 * Converts any caught error into a standardized `NextResponse` JSON body.
 *
 * - `ApiError` instances produce their configured status/code.
 * - `ZodError` instances produce a 400 with field-level details.
 * - All other errors produce a generic 500 response.
 *
 * Full error details (including stack traces) are logged server-side
 * but never exposed in the response payload.
 *
 * @param error - The caught error value.
 * @returns A `NextResponse` with a standardized error body.
 *
 * @example
 * ```ts
 * export async function POST(request: Request) {
 *   try {
 *     const body = signInSchema.parse(await request.json());
 *     // ... handle request
 *   } catch (error) {
 *     return handleApiError(error);
 *   }
 * }
 * ```
 */
export function handleApiError(error: unknown): NextResponse<ApiErrorResponseBody> {
  // Log the full error server-side for debugging
  console.error('[API Error]', error);

  // Known API errors
  if (error instanceof ApiError) {
    return NextResponse.json<ApiErrorResponseBody>(
      {
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        },
      },
      { status: error.statusCode },
    );
  }

  // Zod validation errors
  if (error instanceof ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    const details: Record<string, string[]> = {};

    for (const [key, messages] of Object.entries(fieldErrors)) {
      if (messages) {
        details[key] = messages;
      }
    }

    return NextResponse.json<ApiErrorResponseBody>(
      {
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          statusCode: 400,
          details,
        },
      },
      { status: 400 },
    );
  }

  // Unknown errors — never expose internals
  const message =
    process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : 'An unexpected error occurred';

  return NextResponse.json<ApiErrorResponseBody>(
    {
      error: {
        message,
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
    },
    { status: 500 },
  );
}
