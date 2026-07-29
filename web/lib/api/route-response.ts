import { NextResponse } from 'next/server';
import { NestApiError } from '@/lib/api/errors';

export function jsonFromNestError(error: unknown): NextResponse {
  if (error instanceof NestApiError) {
    const body =
      typeof error.body === 'object' && error.body !== null
        ? error.body
        : { message: error.message };
    return NextResponse.json(body, { status: error.status });
  }

  return NextResponse.json(
    { message: 'Internal server error' },
    { status: 500 },
  );
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ message: 'Unauthorized.' }, { status: 401 });
}
