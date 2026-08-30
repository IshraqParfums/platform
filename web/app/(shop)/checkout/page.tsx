import type { Metadata } from "next";
import { CheckoutPageClient } from "@/components/checkout/checkout-page";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Secure checkout for Ishraq Parfums.",
};

/**
 * Plain `<section>` + a form-width inner column, matching the `/cart` page's
 * move off the v1 `Section`/`Container` pair (see the comment on that file).
 * Checkout is one column of numbered steps rather than a two-up layout, so
 * it caps narrower than `BandInner`'s 1320px shop width — the same measure
 * the old `Container size="form"` used, just carried on the v2 padding
 * scale. `/checkout` is a paper route now (see `isPaperStorefrontPath` in
 * lib/layout.ts).
 */
export default function CheckoutPage() {
  return (
    <section className="bg-paper py-10 pb-16 md:py-14 md:pb-24">
      <div className="mx-auto w-full max-w-[64rem] px-5 sm:px-8 lg:px-12">
        <CheckoutPageClient />
      </div>
    </section>
  );
}
