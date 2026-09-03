import type { WishlistMergeResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";

export async function POST(request: Request): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) {
    return unauthorizedResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const slugsRaw =
    typeof body === "object" && body !== null
      ? (body as { slugs?: unknown }).slugs
      : null;
  const slugs = Array.isArray(slugsRaw)
    ? slugsRaw.filter((slug): slug is string => typeof slug === "string")
    : [];

  try {
    const { data } = await shopAuthFetch<WishlistMergeResponse>(
      "/wishlist/merge",
      { method: "POST", body: { slugs } },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
