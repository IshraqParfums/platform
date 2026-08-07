import type { AdjustStockBody, AdminProductVariant } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";

type RouteContext = { params: Promise<{ id: string; variantId: string }> };

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { id, variantId } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { data } = await adminAuthFetch<AdminProductVariant>(
      `/admin/products/${encodeURIComponent(id)}/variants/${encodeURIComponent(variantId)}/stock`,
      { method: "PATCH", body: body as AdjustStockBody },
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
