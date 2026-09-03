import type { WishlistResponse } from "@ishraqparfums/shared";
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

  const slug =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { slug?: unknown }).slug === "string"
      ? (body as { slug: string }).slug
      : null;

  if (!slug) {
    return NextResponse.json({ message: "slug is required" }, { status: 400 });
  }

  try {
    const { data } = await shopAuthFetch<WishlistResponse>("/wishlist/items", {
      method: "POST",
      body: { slug },
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
