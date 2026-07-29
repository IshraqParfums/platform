import 'server-only';

import { getNestApiBaseUrl } from '@/lib/config';
import { NestApiError, readNestErrorBody } from '@/lib/api/errors';

export interface NestFetchInit {
  method?: string;
  body?: unknown;
  accessToken?: string | null;
  headers?: HeadersInit;
  cache?: RequestCache;
  /** Next.js cache directives. Mutually exclusive with `cache`. */
  next?: { revalidate?: number | false; tags?: string[] };
}

export interface NestFetchResult<T> {
  data: T;
  status: number;
}

/**
 * Dumb Nest HTTP client. No cookies, no refresh — callers pass Bearer when needed.
 */
export async function nestFetch<T>(
  path: string,
  init: NestFetchInit = {},
): Promise<NestFetchResult<T>> {
  const base = getNestApiBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}/api/v1${normalizedPath}`;

  const headers = new Headers(init.headers);
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (init.accessToken) {
    headers.set('Authorization', `Bearer ${init.accessToken}`);
  }

  // `cache` and `next` cannot both be set; default to no-store only when the
  // caller has not asked for revalidation.
  const cacheOptions = init.next
    ? { next: init.next }
    : { cache: init.cache ?? ('no-store' as RequestCache) };

  const response = await fetch(url, {
    method: init.method ?? (init.body !== undefined ? 'POST' : 'GET'),
    headers,
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    ...cacheOptions,
  });

  if (response.status === 204) {
    return { data: undefined as T, status: 204 };
  }

  if (!response.ok) {
    const body = await readNestErrorBody(response);
    throw new NestApiError(response.status, body);
  }

  const text = await response.text();
  if (!text) {
    return { data: undefined as T, status: response.status };
  }

  return { data: JSON.parse(text) as T, status: response.status };
}
