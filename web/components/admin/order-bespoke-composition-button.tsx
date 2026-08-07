import { ButtonLink } from "@/components/ui/button";

/**
 * Order line CTA → full admin brew page (formula + answer log).
 * Prefer page over modal so production can keep the sheet open while packing.
 */
export function OrderBespokeCompositionLink({
  bespokePerfumeId,
}: {
  bespokePerfumeId: string;
}) {
  return (
    <ButtonLink
      href={`/admin/bespoke/${bespokePerfumeId}`}
      variant="outline"
      size="sm"
    >
      View composition
    </ButtonLink>
  );
}

/** Lightweight bespoke badge for order line headers. */
export function BespokeOrderBadge() {
  return (
    <span className="inline-flex items-center rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 font-mono text-label-sm uppercase text-gold-deeper">
      Bespoke
    </span>
  );
}
