import type { OrderSummary, PaginatedResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";

export async function GET(request: Request): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page");
  const pageSize = searchParams.get("pageSize");
  const query = new URLSearchParams();
  if (page) query.set("page", page);
  if (pageSize) query.set("pageSize", pageSize);
  const qs = query.toString();

  try {
    const { data } = await shopAuthFetch<PaginatedResponse<OrderSummary>>(
      qs ? `/orders?${qs}` : "/orders",
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
