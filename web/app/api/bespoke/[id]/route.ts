import { NextResponse } from 'next/server';
import type { BespokePerfumeCustomerResponse } from '@ishraqparfums/shared';
import { shopAuthFetch } from '@/lib/api/auth-fetch';
import { jsonFromNestError, unauthorizedResponse } from '@/lib/api/route-response';
import { getShopAccessToken } from '@/lib/auth/session';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();
  const { id } = await context.params;
  try {
    const { data } = await shopAuthFetch<BespokePerfumeCustomerResponse>(
      `/bespoke/${encodeURIComponent(id)}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();
  const { id } = await context.params;
  try {
    const body = await request.json();
    const { data } = await shopAuthFetch<BespokePerfumeCustomerResponse>(
      `/bespoke/${encodeURIComponent(id)}`,
      { method: 'PATCH', body },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();
  const { id } = await context.params;
  try {
    await shopAuthFetch<void>(`/bespoke/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return jsonFromNestError(error);
  }
}
