"use client";

import type { AdminCollectionResponse } from "@ishraqparfums/shared";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { useAdminListPending } from "@/components/admin/admin-list-pending";
import { ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

const STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "DRAFT", label: "Draft" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "DELETED", label: "Deleted" },
  { value: "all", label: "All" },
] as const;

/**
 * Products list chrome.
 * Mobile: actions → search → 2-col filters (stacked).
 * Desktop: one toolbar — actions · search · status · collection.
 */
export function ProductsFilterBar({
  status,
  collectionId,
  search,
  collections,
}: {
  status: string;
  collectionId?: string;
  search?: string;
  collections: AdminCollectionResponse[];
}) {
  const { push } = useAdminListPending();
  const pathname = usePathname();
  const [searchValue, setSearchValue] = useState(search ?? "");

  useEffect(() => {
    setSearchValue(search ?? "");
  }, [search]);

  function navigate(next: {
    status?: string;
    collectionId?: string;
    search?: string;
  }) {
    const params = new URLSearchParams();
    const nextStatus = next.status ?? status;
    if (nextStatus && nextStatus !== "all") params.set("status", nextStatus);
    if (nextStatus === "all") params.set("status", "all");

    const nextCollection =
      next.collectionId !== undefined ? next.collectionId : (collectionId ?? "");
    if (nextCollection) params.set("collectionId", nextCollection);

    const nextSearch =
      next.search !== undefined ? next.search : (search ?? "");
    if (nextSearch.trim()) params.set("search", nextSearch.trim());

    const qs = params.toString();
    push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSearchSubmit(event: FormEvent) {
    event.preventDefault();
    navigate({ search: searchValue });
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      navigate({ search: searchValue });
    }
  }

  const fieldClass =
    "rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink outline-none focus-visible:border-ink/40";

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:flex-nowrap lg:items-center lg:gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:shrink-0 lg:flex-nowrap">
        <ButtonLink
          href="/admin/products/new"
          variant="emphasis"
          size="md"
          className="w-full justify-center sm:w-auto"
        >
          New product
        </ButtonLink>
        <ButtonLink
          href="/admin/products/low-stock"
          variant="outline"
          size="md"
          className="w-full justify-center sm:w-auto"
        >
          Low stock inventory
        </ButtonLink>
      </div>

      <form
        onSubmit={onSearchSubmit}
        className="w-full min-w-0 lg:w-56 lg:max-w-xs lg:shrink-0 xl:w-64"
      >
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          onKeyDown={onSearchKeyDown}
          placeholder="Search products…"
          className={`w-full ${fieldClass} placeholder:text-ink-faint`}
          aria-label="Search products"
        />
      </form>

      <div className="grid grid-cols-2 gap-3 lg:ml-auto lg:flex lg:shrink-0 lg:items-center lg:gap-3">
        <Select
          value={status}
          options={[...STATUSES]}
          ariaLabel="Filter by status"
          className="min-w-0 w-full lg:w-[10.5rem]"
          triggerClassName="w-full truncate"
          onChange={(value) => navigate({ status: value })}
        />

        <Select
          value={collectionId ?? ""}
          options={[
            { value: "", label: "All collections" },
            ...collections.map((collection) => ({
              value: collection.id,
              label: collection.name,
            })),
          ]}
          ariaLabel="Filter by collection"
          className="min-w-0 w-full lg:w-[13rem]"
          triggerClassName="w-full truncate"
          onChange={(value) => navigate({ collectionId: value })}
        />
      </div>
    </div>
  );
}
