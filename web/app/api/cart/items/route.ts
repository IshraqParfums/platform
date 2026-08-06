import type { CartResponse } from "@ishraqparfums/shared";
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

  const variantId =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { variantId?: unknown }).variantId === "string"
      ? (body as { variantId: string }).variantId
      : null;
  const quantityRaw =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { quantity?: unknown }).quantity === "number"
      ? (body as { quantity: number }).quantity
      : 1;

  if (!variantId) {
    return NextResponse.json(
      { message: "variantId is required" },
      { status: 400 },
    );
  }

  const quantity = Number.isInteger(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;

  try {
    const { data } = await shopAuthFetch<CartResponse>("/cart/items", {
      method: "POST",
      body: { variantId, quantity },
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
