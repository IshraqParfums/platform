import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { NotFoundView } from "@/components/site/not-found-view";
import { HEADER_HEIGHT_PX } from "@/lib/layout";
import { SHOP_NOT_FOUND } from "@/lib/site/not-found";

export const metadata: Metadata = {
  title: "Page not found",
};

/**
 * Global unmatched routes (e.g. /bespoke) only mount the root layout.
 * Include shop chrome here so the 404 still feels like Ishraq.
 */
export default function GlobalNotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-1 flex-col" style={{ paddingTop: HEADER_HEIGHT_PX }}>
        <NotFoundView {...SHOP_NOT_FOUND} />
      </main>
      <Footer />
    </>
  );
}
