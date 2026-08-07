import type { ArchiveCollectionResponse } from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";
import { revalidateCatalogCollections } from "@/lib/catalog/catalog-cache";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  _request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { id } = await context.params;

  try {
    const { data } = await adminAuthFetch<ArchiveCollectionResponse>(
      `/admin/collections/${encodeURIComponent(id)}/archive`,
      { method: "POST" },
    );
    revalidateCatalogCollections();
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
