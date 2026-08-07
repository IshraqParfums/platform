import type {
  AdminProductDetail,
  AdminProductListItem,
  CreateProductBody,
  PaginatedResponse,
} from "@ishraqparfums/shared";
import { NextResponse } from "next/server";
import { adminAuthFetch } from "@/lib/api/auth-fetch";
import { jsonFromNestError, unauthorizedResponse } from "@/lib/api/route-response";
import { getAdminAccessToken } from "@/lib/auth/session";
import { revalidateCatalogProducts } from "@/lib/catalog/catalog-cache";

export async function GET(request: Request): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();
  for (const key of ["status", "collectionId", "search", "page", "pageSize"]) {
    const value = searchParams.get(key);
    if (value) query.set(key, value);
  }
  const qs = query.toString();

  try {
    const { data } = await adminAuthFetch<PaginatedResponse<AdminProductListItem>>(
      qs ? `/admin/products?${qs}` : "/admin/products",
    );
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const accessToken = await getAdminAccessToken();
  if (!accessToken) return unauthorizedResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const { data } = await adminAuthFetch<AdminProductDetail>("/admin/products", {
      method: "POST",
      body: body as CreateProductBody,
    });
    revalidateCatalogProducts(data.slug);
    return NextResponse.json(data);
  } catch (error) {
    return jsonFromNestError(error);
  }
}
