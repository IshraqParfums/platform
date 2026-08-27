import type { ProductOlfactoryProfile } from "@ishraqparfums/shared";
import { Reveal } from "@/components/ui/reveal";

/** "VERY_LONG" -> "Very long" */
function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Scent metadata — family label, character/season/occasion as text-only
 * bordered pill chips, and intensity/sillage/longevity/gender as plain
 * key:value rows. No meter/gauge widget, no icons — text only.
 */
export function ProductScentProfile({
  olfactoryProfile,
}: {
  olfactoryProfile: ProductOlfactoryProfile | null;
}) {
  if (!olfactoryProfile) return null;

  const { family, character, intensity, sillage, longevity, season, occasion, gender } =
    olfactoryProfile;
  const tags = [...character, ...season, ...occasion];

  const rows = [
    intensity ? { label: "Intensity", value: humanize(intensity) } : null,
    sillage ? { label: "Sillage", value: humanize(sillage) } : null,
    longevity ? { label: "Longevity", value: humanize(longevity) } : null,
    gender ? { label: "For", value: humanize(gender) } : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  if (!family && tags.length === 0 && rows.length === 0) return null;

  return (
    <Reveal>
      <div className="border-t border-graphite/10 pt-6">
        <p className="text-[13px] text-terra">Scent profile</p>

        {family ? (
          <p className="mt-3 font-editorial text-h4-editorial text-graphite">
            {family}
          </p>
        ) : null}

        {tags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={`${tag}-${index}`}
                className="rounded-full border border-graphite/20 px-3 py-1 text-[11px] uppercase tracking-[0.14em] text-terra"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {rows.length > 0 ? (
          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
            {rows.map((row) => (
              <div key={row.label}>
                <dt className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
                  {row.label}
                </dt>
                <dd className="mt-1 text-[15px] text-graphite">{row.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </Reveal>
  );
}
