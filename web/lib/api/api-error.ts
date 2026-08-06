/**
 * Browser-side errors from the shop BFF, with the HTTP status kept intact.
 *
 * This is the client half of `lib/api`. `NestApiError` in `./errors.ts` is the
 * server half — it travels with `nest.ts` (`server-only`) and carries a raw Nest
 * body that means nothing here. Two names, one per side of the wire.
 *
 * The status matters because it is the only thing that distinguishes a link that
 * can never work from a request that might succeed on the next try. Callers used
 * to infer that from message text, which broke the moment the API answered 400
 * instead of 404.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Builds the error for a non-OK response. Nest sends `message` as a string, or
 * as an array for validation failures; an empty or non-JSON body falls back.
 */
export async function apiErrorFrom(
  response: Response,
  fallback = 'Something went wrong',
): Promise<ApiError> {
  let message = fallback;

  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      message = body.message.join(' ');
    } else if (typeof body.message === 'string' && body.message.length > 0) {
      message = body.message;
    }
  } catch {
    /* keep the fallback */
  }

  return new ApiError(response.status, message);
}

/** What a screen can actually do about a failure. */
export type ApiFailure = 'unauthorized' | 'unavailable' | 'transient';

/**
 * `unauthorized` is final: every client goes through `shopFetch`, which has
 * already refreshed the session and retried once before a 401 reaches here.
 *
 * `unavailable` covers a malformed id (400), a forbidden one (403) and a missing
 * one (404) — the orders API answers 404 for another customer's order too, on
 * purpose, so these are one case to the customer: this is not yours to see, and
 * retrying will not change that.
 */
export function classifyApiError(error: unknown): ApiFailure {
  if (!(error instanceof ApiError)) return 'transient';
  if (error.status === 401) return 'unauthorized';
  if (error.status === 400 || error.status === 403 || error.status === 404) {
    return 'unavailable';
  }
  return 'transient';
}
