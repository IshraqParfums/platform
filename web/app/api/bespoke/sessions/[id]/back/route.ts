import { NextResponse } from 'next/server';
import type { BespokeSessionViewResponse } from '@ishraqparfums/shared';
import { jsonFromNestError } from '@/lib/api/route-response';
import { bespokeNestFetch } from '@/lib/bespoke/bespoke-fetch';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  try {
    const { data } = await bespokeNestFetch<BespokeSessionViewResponse>(
      `/bespoke/sessions/${encodeURIComponent(id)}/back`,
      { method: 'POST' },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
