import { BandInner } from "@/components/home-v2/ui/band";
import { Urdu } from "@/components/home-v2/ui/urdu";
import { HOME_MATERIALS } from "@/lib/content/home-v2";
import { cn } from "@/lib/cn";
import { ElbowLine, MaterialCopy } from "./callout";
import { Specimen } from "./specimen";

type Material = (typeof HOME_MATERIALS.items)[number];

/**
 * Locked unit: specimen → rising elbow → copy.
 * `flip` mirrors for zigzag / right column.
 */
function MaterialEntry({
  item,
  flip,
  sizes,
}: {
  item: Material;
  flip: boolean;
  sizes: string;
}) {
  const elbowSide = flip ? "left" : "right";
  const copyAlign = flip ? "right" : "left";

  return (
    <figure
      className={cn(
        "flex items-start gap-0 sm:gap-1",
        flip && "flex-row-reverse",
      )}
    >
      <Specimen
        src={item.src}
        alt={item.alt}
        float={item.float}
        sizes={sizes}
        className="mt-6 h-[132px] w-[132px] shrink-0 sm:mt-8 sm:h-[148px] sm:w-[148px]"
        priority={item.id === "sandalwood"}
      />
      <div
        className={cn(
          "flex min-w-0 flex-1 items-start",
          flip && "flex-row-reverse",
        )}
      >
        <ElbowLine side={elbowSide} />
        <MaterialCopy
          name={item.name}
          role={item.role}
          notes={item.notes}
          blurb={item.blurb}
          align={copyAlign}
        />
      </div>
    </figure>
  );
}

export function Materials() {
  /**
   * Tighter on top than the padding below it: the hero ends flush at a
   * full-bleed photo edge (its `pb-16` is interior to the 100dvh frame, not
   * section padding), and a hard edge needs far less clearance than the
   * type-to-type gap underneath.
   */
  return (
    <section className="relative overflow-hidden bg-paper-deep pt-10 md:pt-14 lg:pt-16">
      <BandInner>
        <Urdu size="md" tone="brass" align="start">
          {HOME_MATERIALS.urdu}
        </Urdu>
        <h2 className="mt-2 max-w-[32ch] font-editorial text-h2-editorial text-graphite">
          {HOME_MATERIALS.heading}
        </h2>
      </BandInner>

      <div className="mx-auto mt-12 flex max-w-[520px] flex-col gap-12 px-4 pb-16 sm:gap-14 sm:px-8 md:mt-14 lg:hidden">
        {HOME_MATERIALS.items.map((item, index) => (
          <MaterialEntry
            key={item.id}
            item={item}
            flip={index % 2 === 1}
            sizes="40vw"
          />
        ))}
      </div>

      <div className="mx-auto hidden max-w-[1040px] grid-cols-2 gap-x-14 gap-y-16 px-8 pb-24 pt-12 lg:grid xl:gap-x-16 xl:gap-y-20">
        {HOME_MATERIALS.items.map((item, index) => (
          <MaterialEntry
            key={item.id}
            item={item}
            flip={index % 2 === 1}
            sizes="160px"
          />
        ))}
      </div>
    </section>
  );
}
