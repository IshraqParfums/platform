import type { CartMergeResponse } from "@ishraqparfums/shared";
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

  const itemsRaw =
    typeof body === "object" &&
    body !== null &&
    Array.isArray((body as { items?: unknown }).items)
      ? (body as { items: unknown[] }).items
      : null;

  if (!itemsRaw) {
    return NextResponse.json({ message: "items is required" }, { status: 400 });
  }

  const items = itemsRaw
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as { variantId?: unknown; quantity?: unknown };
      if (typeof row.variantId !== "string") return null;
      const quantity =
        typeof row.quantity === "number" &&
        Number.isInteger(row.quantity) &&
        row.quantity > 0
          ? row.quantity
          : 1;
      return { variantId: row.variantId, quantity };
    })
    .filter((item): item is { variantId: string; quantity: number } =>
      Boolean(item),
    );

  try {
    const { data } = await shopAuthFetch<CartMergeResponse>("/cart/merge", {
      method: "POST",
      body: { items },
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
