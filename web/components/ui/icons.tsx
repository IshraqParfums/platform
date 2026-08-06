import type { SVGProps } from "react";

/**
 * Thin-stroke line icons drawn on a 24px grid. Kept as inline SVG so there is
 * no icon dependency, and stroked with `currentColor` so colour is set by the
 * consumer via text utilities.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** Shipping / delivery. */
export function TruckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M2.6 6.4h11.1v10.2H2.6z" />
      <path d="M13.7 9.7h3.7l3.9 3.7v3.2h-7.6z" />
      <circle cx="7" cy="18.6" r="2" />
      <circle cx="17.4" cy="18.6" r="2" />
    </Base>
  );
}

/** Small-batch / handcrafted composition. */
export function FlaskIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9.6 3.2v6.1l-4.8 8a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3l-4.8-8V3.2" />
      <path d="M8.1 3.2h7.8" />
      <path d="M7.4 14.6h9.2" />
    </Base>
  );
}

/** Raw materials / the perfumer's palette. */
export function DropletIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.1c3.5 4.1 5.7 6.8 5.7 9.6a5.7 5.7 0 1 1-11.4 0c0-2.8 2.2-5.5 5.7-9.6z" />
      <path d="M9.3 13.4a2.9 2.9 0 0 0 2.2 3.4" />
    </Base>
  );
}

/** Magnifying glass — search fields. */
export function SearchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="6.2" />
      <path d="M16.2 16.2L20.5 20.5" />
    </Base>
  );
}

/** Backwards navigation — a drawn arrow, not the thin `←` glyph. */
export function ArrowLeftIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M19 12H5.5" />
      <path d="M11 5.5L4.5 12l6.5 6.5" />
    </Base>
  );
}

/** Secure payment. */
export function ShieldIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.1l7 2.8v5.5c0 4.3-2.9 8.1-7 9.4-4.1-1.3-7-5.1-7-9.4V5.9z" />
      <path d="M9.1 12.2l2.1 2.2 3.9-4.2" />
    </Base>
  );
}

/** Direct message / conversation. */
export function MessageIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4.2 5.2h15.6v10.4H8.1L4.2 19V5.2z" />
      <path d="M8 9.2h8M8 12.4h5.5" />
    </Base>
  );
}
