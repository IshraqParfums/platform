import type { AdminCollectionResponse, UpdateCollectionBody } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";
import { revalidateCatalogCollections } from "@/lib/catalog/catalog-cache";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { data } = await adminAuthFetch<AdminCollectionResponse>(
      `/admin/collections/${encodeURIComponent(id)}`,
      { method: "PATCH", body: body as UpdateCollectionBody },
    );
    revalidateCatalogCollections();
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
