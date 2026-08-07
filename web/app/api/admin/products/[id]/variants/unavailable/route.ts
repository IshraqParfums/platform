import type { AdminProductDetail } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";
import { revalidateCatalogProducts } from "@/lib/catalog/catalog-cache";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const { data } = await adminAuthFetch<AdminProductDetail>(
      `/admin/products/${encodeURIComponent(id)}/variants/unavailable`,
      { method: "PATCH" },
    );
    revalidateCatalogProducts(data.slug);
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
