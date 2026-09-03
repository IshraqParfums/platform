import type { Metadata } from "next";
import { WishlistView } from "@/components/wishlist/wishlist-view";
import { BandInner } from "@/components/home-v2/ui/band";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Your saved Ishraq Parfums scents.",
};

/**
 * Not gated behind a signed-in check, mirroring `/cart` — guests have a real
 * wishlist (localStorage) and must be able to see and use it. See
 * `isPaperStorefrontPath` in `lib/layout.ts`, which this route is also in.
 */
export default function WishlistPage() {
  return (
    <section className="bg-paper py-10 pb-16 md:py-14 md:pb-24">
      <BandInner>
        <WishlistView />
      </BandInner>
    </section>
  );
}
