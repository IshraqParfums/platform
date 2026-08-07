import { NextResponse } from 'next/server';
import type { BespokeSessionResultResponse } from '@ishraqparfums/shared';
import { jsonFromNestError } from '@/lib/api/route-response';
import { bespokeNestFetch } from '@/lib/bespoke/bespoke-fetch';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { id } = await context.params;
  try {
    const { data } = await bespokeNestFetch<BespokeSessionResultResponse>(
      `/bespoke/sessions/${encodeURIComponent(id)}/result`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
