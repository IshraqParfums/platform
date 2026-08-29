import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/cart-page";
import { BandInner } from "@/components/home-v2/ui/band";

export const metadata: Metadata = {
  title: "Cart",
  description: "Your Ishraq Parfums cart.",
};

/**
 * Plain `<section>` + `BandInner` rather than the v1 `Section`/`Container`
 * pair this page used to render through. `Section` only offers the v1 tone
 * palette (`cream` / `cream-soft` / `deep` / `deep-deeper`), which is why the
 * old version had to fight its own padding scale with `!pt-10`/`!pb-16`
 * overrides to get spacing this page never actually wanted. `/cart` is a
 * paper route now (see `isPaperStorefrontPath` in lib/layout.ts), so it
 * takes its rhythm straight from the v2 scale instead.
 */
export default function CartPage() {
  return (
    <section className="bg-paper py-10 pb-16 md:py-14 md:pb-24">
      <BandInner>
        <CartPageClient />
      </BandInner>
    </section>
  );
}
