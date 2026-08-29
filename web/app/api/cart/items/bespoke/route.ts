import type { CartMutationResult } from '@ishraqparfums/shared';
import { isCartMutationView } from '@ishraqparfums/shared';
import { NextResponse } from 'next/server';
import { shopAuthFetch } from '@/lib/api/auth-fetch';
import { jsonFromNestError, unauthorizedResponse } from '@/lib/api/route-response';
import { getShopAccessToken } from '@/lib/auth/session';
import { listBespokeSessionTokens } from '@/lib/bespoke/session-cookie';

function viewQuery(request: Request): string {
  const view = new URL(request.url).searchParams.get('view');
  return isCartMutationView(view) ? `?view=${view}` : '';
}

export async function POST(request: Request): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
  }

  const record = body as Record<string, unknown>;
  const bespokePerfumeId =
    typeof record.bespokePerfumeId === 'string' ? record.bespokePerfumeId : null;
  const sizeMl = typeof record.sizeMl === 'number' ? record.sizeMl : null;
  const quantity =
    typeof record.quantity === 'number' && Number.isInteger(record.quantity)
      ? record.quantity
      : 1;

  if (!bespokePerfumeId || sizeMl == null) {
    return NextResponse.json(
      { message: 'bespokePerfumeId and sizeMl are required' },
      { status: 400 },
    );
  }

  try {
    const { data } = await shopAuthFetch<CartMutationResult>(
      `/cart/items/bespoke${viewQuery(request)}`,
      {
        method: 'POST',
        body: {
          bespokePerfumeId,
          sizeMl,
          quantity,
          sessionTokens: await listBespokeSessionTokens(),
        },
      },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
