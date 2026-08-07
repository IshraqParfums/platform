import { NextResponse } from 'next/server';
import type { BespokeSessionCreateResponse } from '@ishraqparfums/shared';
import { jsonFromNestError } from '@/lib/api/route-response';
import { bespokeNestFetch } from '@/lib/bespoke/bespoke-fetch';
import { setBespokeSessionToken } from '@/lib/bespoke/session-cookie';

export async function POST(): Promise<NextResponse> {
  try {
    const { data } = await bespokeNestFetch<BespokeSessionCreateResponse>(
      '/bespoke/sessions',
      { method: 'POST' },
    );
    await setBespokeSessionToken(data.sessionToken);
    // Never expose the raw token to the browser — cookie only.
    const { sessionToken: _omit, ...safe } = data;
    return NextResponse.json(safe);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
