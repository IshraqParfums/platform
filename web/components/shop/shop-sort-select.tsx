"use client";

import {
  PRODUCT_LIST_SORT_DEFAULT,
  type ProductListSort,
} from "@ishraqparfums/shared";
import { SHOP_CONTROL_HEIGHT } from "@/components/shop/shop-control";
import { useShopNavigate } from "@/components/shop/shop-navigation";
import { Select } from "@/components/ui/select";
import { buildShopHref } from "@/lib/shop-query";

const OPTIONS: { value: ProductListSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name A–Z" },
];

export function ShopSortSelect({
  sort,
  collection,
  q,
}: {
  sort: ProductListSort;
  collection?: string;
  q?: string;
}) {
  const { navigate } = useShopNavigate();

  return (
    <Select
      label="Sort by"
      labelPlacement="inline"
      ariaLabel="Sort products"
      value={sort}
      options={OPTIONS}
      triggerClassName={`${SHOP_CONTROL_HEIGHT} w-full min-w-0 sm:min-w-[12rem] max-md:min-h-12 max-md:h-12`}
      className="w-full md:w-auto md:shrink-0"
      onChange={(next) => {
        const value = next as ProductListSort;
        navigate(
          buildShopHref({
            collection,
            q,
            sort: value === PRODUCT_LIST_SORT_DEFAULT ? undefined : value,
          }),
        );
      }}
    />
  );
}
