import { BespokePanel } from "@/components/home-v2/bespoke-panel";
import { HeroV2 } from "@/components/home-v2/hero-v2";
import { HouseNote } from "@/components/home-v2/house-note";
import { MarksStrip } from "@/components/home-v2/marks-strip";
import { MaterialsMarquee } from "@/components/home-v2/materials-marquee";
import { Moods } from "@/components/home-v2/moods";
import { PaperField } from "@/components/home-v2/ui/paper-field";
import { Shelf } from "@/components/home-v2/shelf";
import {
  getFeaturedProducts,
  getHomepageCollections,
} from "@/lib/api/catalog";

/**
 * The v2 home page: a buying flow, not a mood board.
 *
 * Order is the argument. Type opens the house, bottles come next, then a
 * mood to browse by, then the quiz for anyone who did not find themselves
 * on the shelf. Trust and the palette sit after the decision, not before it.
 *
 * The old sections still live under components/home/. The unused v2 experiments
 * (movements, masked-photo) stay on disk as rollback, not as imports.
 *
 * `getCollections()` is no longer fetched here: the footer makes that call
 * itself, and nothing on this page needs the full list.
 */
export default async function HomePage() {
  const [featured, homepageCollections] = await Promise.all([
    getFeaturedProducts(4),
    getHomepageCollections(),
  ]);

  return (
    <div className="relative overflow-x-clip bg-paper font-ui text-graphite">
      <PaperField />
      <HeroV2 />
      <Shelf products={featured} />
      <Moods collections={homepageCollections} />
      <BespokePanel />
      <MaterialsMarquee />
      <MarksStrip />
      <HouseNote />
    </div>
  );
}
