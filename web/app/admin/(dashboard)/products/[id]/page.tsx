import type { AdminCollectionResponse, AdminProductDetail } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { ProductImagesPanel } from "@/components/admin/product-images-panel";
import { ProductVariantsPanel } from "@/components/admin/product-variants-panel";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";
import { NestApiError } from "@/lib/api/errors";

export const metadata: Metadata = { title: "Edit product" };

type RouteParams = { params: Promise<{ id: string }> };

export default async function AdminProductDetailPage({ params }: RouteParams) {
  const { id } = await params;

  let product: AdminProductDetail;
  try {
    [product] = await Promise.all([
      adminPageFetch<AdminProductDetail>(`/admin/products/${id}`),
    ]);
  } catch (error) {
    if (error instanceof NestApiError && (error.status === 404 || error.status === 400)) {
      notFound();
    }
    throw error;
  }

  const collections = await adminPageFetch<AdminCollectionResponse[]>(
    "/admin/collections",
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AdminBackLink href="/admin/products">Back to products</AdminBackLink>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          {product.name}
        </h1>
      </div>

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Details</h2>
        <div className="mt-3">
          <ProductEditForm product={product} collections={collections} />
        </div>
      </div>

      <ProductVariantsPanel productId={product.id} variants={product.variants} />

      <ProductImagesPanel productId={product.id} images={product.images} />
    </div>
  );
}
