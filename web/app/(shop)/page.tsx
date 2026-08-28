import { Belief } from "@/components/home-v2/belief";
import { BespokeEntry } from "@/components/home-v2/bespoke-entry";
import { Collection } from "@/components/home-v2/collection";
import { HeroV2 } from "@/components/home-v2/hero-v2";
import { getProducts } from "@/lib/api/catalog";
import { pickCollection } from "@/lib/content/home-v2";
import { HEADER_HEIGHT_PX } from "@/lib/layout";

/**
 * Homepage as a scent journal: collection, bespoke entry, belief.
 *
 * The catalog only feeds the collection (four directed worlds first) — the
 * bespoke entry talks straight to the quiz engine's own session API.
 *
 * Deliberately no trust-strip / shipping-and-checkout messaging anywhere on
 * this page. Small-batch claims live in Belief; shipping and checkout
 * specifics belong on the product detail page, next to the actual purchase
 * decision, not here.
 *
 * Materials still exists under home-v2/materials — it is just not mounted.
 */
export default async function HomePage() {
  const { items } = await getProducts({ pageSize: 24 });
  const collection = pickCollection(items, 4);

  return (
    <div
      className="overflow-x-clip bg-paper font-ui text-graphite"
      style={{ marginTop: -HEADER_HEIGHT_PX }}
    >
      <HeroV2 />
      <Collection products={collection} />
      <BespokeEntry />
      <Belief />
    </div>
  );
}
