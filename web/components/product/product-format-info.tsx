import type { ProductFormatInfo } from "@ishraqparfums/shared";
import { Reveal } from "@/components/ui/reveal";

/**
 * Format details — label/value rows, same typographic treatment as
 * `ProductScentProfile`'s key:value rows.
 */
export function ProductFormatInfo({
  format,
}: {
  format: ProductFormatInfo | null;
}) {
  if (!format) return null;

  const rows = [
    format.formatLabel ? { label: "Format", value: format.formatLabel } : null,
    format.concentration
      ? { label: "Concentration", value: format.concentration }
      : null,
    format.application
      ? { label: "Application", value: format.application }
      : null,
    format.bottleDescription
      ? { label: "Bottle", value: format.bottleDescription }
      : null,
  ].filter((row): row is { label: string; value: string } => row !== null);

  if (rows.length === 0) return null;

  return (
    <Reveal>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-graphite/10 pt-6 sm:grid-cols-4">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
              {row.label}
            </dt>
            <dd className="mt-1 text-[15px] text-graphite">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Reveal>
  );
}
