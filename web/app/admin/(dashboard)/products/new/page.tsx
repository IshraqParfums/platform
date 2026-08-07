import type { AdminCollectionResponse } from "@ishraqparfums/shared";
import type { Metadata } from "next";
import { AdminBackLink } from "@/components/admin/admin-back-link";
import { ProductCreateForm } from "@/components/admin/product-create-form";
import { adminPageFetch } from "@/lib/admin/admin-page-fetch";

export const metadata: Metadata = { title: "New product" };

export default async function AdminNewProductPage() {
  const collections = await adminPageFetch<AdminCollectionResponse[]>(
    "/admin/collections",
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <AdminBackLink href="/admin/products">Back to products</AdminBackLink>
        <h1 className="mt-2 font-display text-2xl font-semibold text-ink">
          New product
        </h1>
      </div>

      {collections.length === 0 ? (
        <div className="rounded-lg border border-ink/10 bg-card p-5">
          <p className="text-sm text-ink-faint">
            Create a collection first — products must belong to one.
          </p>
        </div>
      ) : (
        <ProductCreateForm collections={collections} />
      )}
    </div>
  );
}
