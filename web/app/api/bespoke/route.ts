import { NextResponse } from 'next/server';
import type {
  BespokePerfumeCustomerResponse,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import { shopAuthFetch } from '@/lib/api/auth-fetch';
import { jsonFromNestError, unauthorizedResponse } from '@/lib/api/route-response';
import { getShopAccessToken } from '@/lib/auth/session';

export async function GET(request: Request): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const qs = new URLSearchParams();
  for (const key of ['page', 'pageSize']) {
    const value = searchParams.get(key);
    if (value) qs.set(key, value);
  }
  const suffix = qs.toString() ? `?${qs}` : '';

  try {
    const { data } = await shopAuthFetch<
      PaginatedResponse<BespokePerfumeCustomerResponse>
    >(`/bespoke${suffix}`);
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
