import type { CartMutationResult } from "@ishraqparfums/shared";
import { isCartMutationView } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ itemId: string }> };

function viewQuery(request: Request): string {
  const view = new URL(request.url).searchParams.get("view");
  return isCartMutationView(view) ? `?view=${view}` : "";
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) {
    return unauthorizedResponse();
  }

  const { itemId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  const quantity =
    typeof body === "object" &&
    body !== null &&
    typeof (body as { quantity?: unknown }).quantity === "number"
      ? (body as { quantity: number }).quantity
      : null;

  if (quantity === null || !Number.isInteger(quantity) || quantity < 1) {
    return NextResponse.json(
      { message: "quantity must be an integer ≥ 1" },
      { status: 400 },
    );
  }

  try {
    const { data } = await shopAuthFetch<CartMutationResult>(
      `/cart/items/${encodeURIComponent(itemId)}${viewQuery(request)}`,
      { method: "PATCH", body: { quantity } },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getShopAccessToken();
  if (!accessToken) {
    return unauthorizedResponse();
  }

  const { itemId } = await context.params;

  try {
    const { data } = await shopAuthFetch<CartMutationResult>(
      `/cart/items/${encodeURIComponent(itemId)}${viewQuery(request)}`,
      { method: "DELETE" },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
