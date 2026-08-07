import type { AdminProductDetail } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";
import { revalidateCatalogProducts } from "@/lib/catalog/catalog-cache";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Park a ready draft into an archived collection (ARCHIVED + COLLECTION).
 */
export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const { data } = await adminAuthFetch<AdminProductDetail>(
      `/admin/products/${encodeURIComponent(id)}/park-in-archived-collection`,
      { method: "POST" },
    );
    revalidateCatalogProducts(data.slug);
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
