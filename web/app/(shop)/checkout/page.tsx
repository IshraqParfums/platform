import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/checkout/checkout-page";
import { BandInner } from "@/components/home-v2/ui/band";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout for Ishraq Parfums.",
};

/**
 * Plain `<section>` + a form-width `BandInner`, matching the `/cart` page's
 * move off the v1 `Section`/`Container` pair (see the comment on that file).
 * Checkout is one column of numbered steps rather than a two-up layout, so
 * it caps narrower than `BandInner`'s default 1320px shop width — the same
 * measure the old `Container size="form"` used, now `BandInner`'s own
 * `width="form"` (account's pages use it too). `/checkout` is a paper route
 * now (see `isPaperStorefrontPath` in lib/layout.ts).
 */
export default function CheckoutPage() {
  return (
    <section className="bg-paper py-10 pb-16 md:py-14 md:pb-24">
      <BandInner width="form">
        <CheckoutPageClient />
      </BandInner>
    </section>
  );
}
