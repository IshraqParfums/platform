"use client";

import {
  ADMIN_CUSTOMER_LIST_SORT_DEFAULT,
  type AdminCustomerListSort,
} from "@ishraqparfums/shared";
import { usePathname } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAdminListPending } from "@/components/admin/admin-list-pending";
import { Select } from "@/components/ui/select";

const SORT_OPTIONS: { value: AdminCustomerListSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "orders-desc", label: "Highest orders" },
  { value: "name-asc", label: "Name A–Z" },
];

export function CustomersSearchBar({
  search,
  sort = ADMIN_CUSTOMER_LIST_SORT_DEFAULT,
}: {
  search?: string;
  sort?: AdminCustomerListSort;
}) {
  const { push, isPending } = useAdminListPending();
  const pathname = usePathname();
  const [value, setValue] = useState(search ?? "");

  useEffect(() => {
    setValue(search ?? "");
  }, [search]);

  function hrefFor(next: { search?: string; sort?: AdminCustomerListSort }) {
    const qs = new URLSearchParams();
    const nextSearch =
      next.search !== undefined ? next.search : (search ?? "");
    if (nextSearch.trim()) qs.set("search", nextSearch.trim());

    const nextSort = next.sort ?? sort;
    if (nextSort !== ADMIN_CUSTOMER_LIST_SORT_DEFAULT) {
      qs.set("sort", nextSort);
    }

    const query = qs.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    push(hrefFor({ search: value }));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
      <form
        onSubmit={submit}
        className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3"
      >
        <input
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search name, email or phone…"
          disabled={isPending}
          className="min-w-0 w-full rounded-md border border-ink/15 bg-cream px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus-visible:border-ink/40 disabled:opacity-60 sm:max-w-xs"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 cursor-pointer rounded-full bg-ink px-4 py-2 text-sm font-medium text-cream-soft disabled:opacity-55"
        >
          Search
        </button>
      </form>

      <Select
        value={sort}
        options={SORT_OPTIONS}
        ariaLabel="Sort customers"
        className="w-full sm:w-[11.5rem] sm:shrink-0"
        triggerClassName="w-full truncate"
        onChange={(next) => {
          push(hrefFor({ sort: next as AdminCustomerListSort }));
        }}
      />
    </div>
  );
}
