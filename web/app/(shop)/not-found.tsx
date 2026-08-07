import type { Metadata } from "next";
import { NotFoundView } from "@/components/site/not-found-view";
import { SHOP_NOT_FOUND } from "@/lib/site/not-found";

export const metadata: Metadata = {
  title: "Page not found",
};

/** Triggered by `notFound()` inside the shop segment (header/footer already on). */
export default function ShopNotFound() {
  return <NotFoundView {...SHOP_NOT_FOUND} />;
}
