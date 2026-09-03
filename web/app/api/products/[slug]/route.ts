import type { ProductDetail } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { nestFetch } from "@/lib/api/nest";
import { jsonFromNestError } from "@/lib/api/route-response";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * Public product detail, for the one client component that needs it
 * (`/wishlist`'s "Move to cart", which has to pick a variant and `getProductBySlug`
 * — server-only — can't run there). No auth: this is the same data the PDP
 * itself already renders to anyone.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const { slug } = await context.params;

  try {
    const { data } = await nestFetch<ProductDetail>(
      `/products/${encodeURIComponent(slug)}`,
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
