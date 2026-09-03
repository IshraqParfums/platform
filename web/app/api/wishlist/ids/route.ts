import type { WishlistIdsResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";

/** The cheap payload every heart button reads — slugs only, no display data. */
export async function GET(): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) {
    return unauthorizedResponse();
  }

  try {
    const { data } = await shopAuthFetch<WishlistIdsResponse>(
      "/wishlist/ids",
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
