import type { CartMergeResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { shopAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getShopAccessToken } from "@/lib/auth/session";
import { listBespokeSessionTokens } from "@/lib/bespoke/session-cookie";

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

  const record =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null;
  const itemsRaw = Array.isArray(record?.items) ? record.items : null;
  const bespokeRaw = Array.isArray(record?.bespokeItems)
    ? record.bespokeItems
    : [];

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

  const bespokeItems = bespokeRaw
    .map((item) => {
      if (typeof item !== "object" || item === null) return null;
      const row = item as {
        bespokePerfumeId?: unknown;
        sizeMl?: unknown;
        quantity?: unknown;
      };
      if (typeof row.bespokePerfumeId !== "string") return null;
      if (typeof row.sizeMl !== "number") return null;
      const quantity =
        typeof row.quantity === "number" &&
        Number.isInteger(row.quantity) &&
        row.quantity > 0
          ? row.quantity
          : 1;
      return {
        bespokePerfumeId: row.bespokePerfumeId,
        sizeMl: row.sizeMl,
        quantity,
      };
    })
    .filter(
      (
        item,
      ): item is {
        bespokePerfumeId: string;
        sizeMl: number;
        quantity: number;
      } => Boolean(item),
    );

  try {
    const { data } = await shopAuthFetch<CartMergeResponse>("/cart/merge", {
      method: "POST",
      body: {
        items,
        bespokeItems,
        sessionTokens: await listBespokeSessionTokens(),
      },
    });
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
