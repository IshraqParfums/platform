import type { Metadata } from "next";
import { NotFoundView } from "@/components/site/not-found-view";
import { ADMIN_NOT_FOUND } from "@/lib/site/not-found";

export const metadata: Metadata = {
  title: "Page not found",
};

/** Triggered by `notFound()` under /admin (e.g. missing product/order id). */
export default function AdminNotFound() {
  return <NotFoundView {...ADMIN_NOT_FOUND} />;
}
