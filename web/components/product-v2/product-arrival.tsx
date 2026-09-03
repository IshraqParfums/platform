import type { ProductDetail } from "@ishraqparfums/shared";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { ProductHeroPlate } from "@/components/product-v2/product-hero-plate";
import { ProductPurchasePanel } from "@/components/product-v2/product-purchase-panel";
import { ProductRating } from "@/components/product-v2/product-rating";
import { ProductUnavailableNotice } from "@/components/product-v2/product-unavailable-notice";
import { ProductShare } from "@/components/product/product-share";
import { WishlistHeartButton } from "@/components/wishlist/wishlist-heart-button";
import { productDetailToListItem } from "@/lib/catalog/product-detail-to-list-item";

/**
 * The arrival — identity and commerce in one composition.
 *
 * Structure follows the home hero: Urdu → headline → lead → CTA
 * group, type on the left at `lg` with photography entering from the right.
 * It does not borrow the hero's `100dvh`, because this column also carries
 * size, price and a cart button.
 *
 * `nameUrdu` is the identity line — the product's actual name, which is why
 * it sits directly above the English one rather than floating elsewhere on
 * the page. It renders in `brass-deep` rather than the homepage's `brass`:
 * plain brass measures 3.2:1 on parchment and fails at this size, and the
 * point of the line is to be read, not to be a wash.
 *
 * `tagline` takes the lead slot; `shortDescription` only stands in when
 * there's no tagline. Carrying both said the same thing twice, and the short
 * description was already read on the card that got you here. Pronunciation
 * and meaning live in the name section below, where they open the story
 * instead of crowding the hero.
 */
export function ProductArrival({ product }: { product: ProductDetail }) {
  const images = [...product.images].sort(
    (a, b) => a.displayOrder - b.displayOrder,
  );
  const lead = product.tagline?.primary ?? product.shortDescription;
  const unavailable = product.availability !== "AVAILABLE";

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] lg:items-stretch lg:gap-12">
      <ProductHeroPlate
        name={product.name}
        images={images}
        className="lg:col-start-2 lg:row-start-1"
      />

      <div className="pt-8 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:justify-center lg:pt-0 lg:pr-8">
        <div className="flex items-center justify-between gap-3">
          {product.nameUrdu ? (
            <Urdu
              size="md"
              tone="brass-deep"
              leading="tight"
              as="span"
              className="min-w-0"
            >
              {product.nameUrdu}
            </Urdu>
          ) : (
            <span />
          )}
          <WishlistHeartButton
            product={productDetailToListItem(product)}
            variant="inline"
            className="-me-1.5"
          />
        </div>

        <div className="mt-2 flex items-start justify-between gap-4">
          <h1 className="min-w-0 font-editorial text-[clamp(34px,5vw,56px)] leading-[1.04] tracking-[-0.02em] text-graphite">
            {product.name}
          </h1>
          <ProductShare
            name={product.name}
            slug={product.slug}
            blurb={product.shortDescription}
            className="mt-1 shrink-0"
          />
        </div>

        {lead ? (
          <p className="mt-1 max-w-[46ch] text-[17px] leading-[1.6] text-graphite">
            {lead}
          </p>
        ) : null}

        {product.ratingAverage !== null && product.reviewCount > 0 ? (
          <a
            href="#reviews"
            className="mt-1 inline-flex transition-opacity hover:opacity-80"
          >
            <ProductRating
              average={product.ratingAverage}
              count={product.reviewCount}
            />
          </a>
        ) : null}

        {unavailable ? (
          <div className="mt-7">
            <ProductUnavailableNotice
              availability={
                product.availability === "UNAVAILABLE"
                  ? "UNAVAILABLE"
                  : "OUT_OF_STOCK"
              }
            />
          </div>
        ) : null}

        <div className="mt-1.5">
          <ProductPurchasePanel />
        </div>
      </div>
    </div>
  );
}
