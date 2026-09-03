import type { WishlistResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ slug: string }> };

export async function DELETE(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) {
    return unauthorizedResponse();
  }

  const { slug } = await context.params;

  try {
    const { data } = await shopAuthFetch<WishlistResponse>(
      `/wishlist/items/${encodeURIComponent(slug)}`,
      { method: "DELETE" },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
