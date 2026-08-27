import type {
  ProductFormatInfo,
  ProductOlfactoryProfile,
} from "@ishraqparfums/shared";

/** "UNISEX" → "Unisex". */
function humanize(value: string): string {
  const spaced = value.toLowerCase().split("_").join(" ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The back label — the specification, in one plate.
 *
 * Deliberately denser than the sections around it: after prose and lists, a
 * tight block of facts reads as intentional, and it's honest about what it
 * is — the label on the back of the bottle, which is where a customer
 * expects concentration and format.
 *
 * Dense is not the same as unreadable, though. The labels were 10px
 * `graphite-faint` (2.8:1, the smallest and faintest text anywhere on the
 * page) and are now at the secondary floor and a real size. Values are
 * `graphite`.
 *
 * Wear-context facts — season, occasion, longevity — are not here; they
 * answer "what is this like", so they belong to "How it smells". This holds
 * only what's true of the bottle plus who it's for.
 */
export function ProductBackLabel({
  format,
  olfactoryProfile,
}: {
  format: ProductFormatInfo | null;
  olfactoryProfile: ProductOlfactoryProfile | null;
}) {
  const rows = [
    format?.formatLabel ? { label: "Format", value: format.formatLabel } : null,
    format?.concentration
      ? { label: "Concentration", value: format.concentration }
      : null,
    format?.application
      ? { label: "Application", value: format.application }
      : null,
    olfactoryProfile?.gender
      ? { label: "For", value: humanize(olfactoryProfile.gender) }
      : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  const bottle = format?.bottleDescription ?? null;

  if (rows.length === 0 && !bottle) return null;

  return (
    <div className="bg-paper-deep px-6 py-7 sm:px-9 sm:py-9">
      <p className="text-[13px] text-terra">On the label</p>

      {rows.length > 0 ? (
        <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
          {rows.map((row) => (
            <div key={row.label}>
              <dt className="text-[13px] text-graphite-soft">{row.label}</dt>
              <dd className="mt-1 text-[16px] leading-[1.45] text-graphite">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {bottle ? (
        <p className="mt-7 max-w-[62ch] text-[16px] leading-[1.6] text-graphite">
          {bottle}
        </p>
      ) : null}
    </div>
  );
}
