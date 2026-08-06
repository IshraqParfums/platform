import type { OrderDetail } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const { data } = await shopAuthFetch<OrderDetail>(
      `/orders/${encodeURIComponent(id)}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
