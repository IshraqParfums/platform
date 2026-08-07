import type { AdminCollectionResponse, AdminProductDetail } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { ProductEditForm } from "@/components/admin/product-edit-form";
import { ProductImagesPanel } from "@/components/admin/product-images-panel";
import { ProductStatusActions } from "@/components/admin/product-status-actions";
import { ProductVariantsPanel } from "@/components/admin/product-variants-panel";
import { Badge } from "@/components/ui/badge";
import { ProductShare } from "@/components/product/product-share";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";
import { adminProductStatusLabel } from "@/lib/admin/product-status";
import { NestApiError } from "@/lib/api/errors";

export const metadata: Metadata = { title: "Edit product" };

type RouteParams = { params: Promise<{ id: string }> };

function isSellableVariant(variant: {
  isAvailable: boolean;
  stockQty: number;
  reservedQty: number;
}): boolean {
  return (
    variant.isAvailable &&
    Math.max(0, variant.stockQty - variant.reservedQty) > 0
  );
}

function isOnShelfVariant(variant: { isAvailable: boolean }): boolean {
  return variant.isAvailable;
}

export default async function AdminProductDetailPage({ params }: RouteParams) {
  const { id } = await params;

  let product: AdminProductDetail;
  try {
    product = await adminPageFetch<AdminProductDetail>(`/admin/products/${id}`);
  } catch (error) {
    if (error instanceof NestApiError && (error.status === 404 || error.status === 400)) {
      notFound();
    }
    throw error;
  }

  const collections = await adminPageFetch<AdminCollectionResponse[]>(
    "/admin/collections",
  );

  const isDeleted = product.status === "DELETED";
  const hasOnShelfVariant = product.variants.some(isOnShelfVariant);
  const hasSellableVariant = product.variants.some(isSellableVariant);
  const isShelfOff = product.status === "ACTIVE" && !hasOnShelfVariant;
  const isSoldOut =
    product.status === "ACTIVE" && hasOnShelfVariant && !hasSellableVariant;

  if (isDeleted) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <AdminBackLink href="/admin/products">Back to products</AdminBackLink>
          <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
            {product.name}
          </h1>
        </div>

        <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Summary</h2>
          <p className="mt-2 text-sm text-ink-soft">
            This product is deleted and read-only.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                Name
              </dt>
              <dd className="mt-1 text-sm font-medium text-ink">{product.name}</dd>
            </div>
            <div>
              <dt className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                Status
              </dt>
              <dd className="mt-1">
                <Badge tone="neutral">
                  {adminProductStatusLabel(product.status)}
                </Badge>
              </dd>
            </div>
            <div>
              <dt className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                Collection
              </dt>
              <dd className="mt-1 text-sm text-ink">{product.collectionName}</dd>
            </div>
            <div>
              <dt className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
                Variants / images
              </dt>
              <dd className="mt-1 text-sm text-ink">
                {product.variants.length} variant
                {product.variants.length === 1 ? "" : "s"},{" "}
                {product.images.length} image
                {product.images.length === 1 ? "" : "s"}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AdminBackLink href="/admin/products">Back to products</AdminBackLink>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-2xl font-semibold text-ink">
            {product.name}
          </h1>
          <ProductShare
            name={product.name}
            slug={product.slug}
            blurb={product.shortDescription}
            variant="labeled"
            menuAlign="right"
            className="shrink-0"
          />
        </div>
      </div>

      {isShelfOff ? (
        <div
          role="status"
          className="rounded-lg border border-rose-deep/25 bg-rose-deep/[0.06] px-4 py-3 text-sm leading-relaxed text-ink"
        >
          <p className="font-medium text-ink">Hidden from the shop</p>
          <p className="mt-1 text-ink-soft">
            Every size is flagged unavailable, so this product is off the
            storefront shelf. Customers with a direct link can still view it but
            cannot buy. Make at least one size available to list it again.
          </p>
        </div>
      ) : null}

      {isSoldOut ? (
        <div
          role="status"
          className="rounded-lg border border-ink/15 bg-cream-soft/80 px-4 py-3 text-sm leading-relaxed text-ink"
        >
          <p className="font-medium text-ink">Visible but sold out</p>
          <p className="mt-1 text-ink-soft">
            This product still appears in the shop with a sold-out state.
            Customers can open it and see sizes, but nothing can be added to cart
            until free stock returns on an available size.
          </p>
        </div>
      ) : null}

      <ProductStatusActions
        productId={product.id}
        status={product.status}
        archiveReason={product.archiveReason}
      />

      <div className="rounded-lg border border-ink/10 bg-card p-4 sm:p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Details</h2>
        <div className="mt-3">
          <ProductEditForm product={product} collections={collections} />
        </div>
      </div>

      <ProductVariantsPanel
        productId={product.id}
        status={product.status}
        variants={product.variants}
      />

      <ProductImagesPanel productId={product.id} images={product.images} />
    </div>
  );
}
