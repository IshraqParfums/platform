import { BespokeTeaser } from "@/components/home/bespoke-teaser";
import { BrandStory } from "@/components/home/brand-story";
import { CollectionsShowcase } from "@/components/home/collections-showcase";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { PaletteMarquee } from "@/components/home/palette-marquee";
import { TrustStrip } from "@/components/home/trust-strip";
import { getCollections, getFeaturedProducts } from "@/lib/api/catalog";

export default async function HomePage() {
  const [featured, collections] = await Promise.all([
    getFeaturedProducts(4),
    getCollections(),
  ]);

  return (
    <>
      <Hero />
      <TrustStrip />
      <FeaturedProducts products={featured} collections={collections} />
      <CollectionsShowcase collections={collections} />
      <BespokeTeaser />
      <PaletteMarquee />
      <BrandStory />
    </>
  );
}
