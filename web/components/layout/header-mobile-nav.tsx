import type { ComponentType, SVGProps } from "react";
import Link from "next/link";
import type { NavLinkTone } from "@/components/layout/bespoke-saved-nav-link";
import { HeaderWhatsAppLink } from "@/components/layout/header-mobile-shortcuts";
import { ACCOUNT_HOME } from "@/lib/auth/account-routes";
import { cn } from "@/lib/cn";

type IconProps = SVGProps<SVGSVGElement>;

/** Same 24px stroke as the header bag / shop / heart — not lucide. */
function NavIcon({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

function ShopIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M3 9.5 5.5 5h13L21 9.5" />
      <path d="M3.5 9.5h17" />
      <path d="M5 9.5V20h14V9.5" />
      <path d="M10 20v-6h4v6" />
      <path d="M8 9.5v-2M12 9.5v-2.5M16 9.5v-2" />
    </NavIcon>
  );
}

function CollectionsIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
    </NavIcon>
  );
}

function BespokeIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M9.6 3.2v6.1l-4.8 8a2 2 0 0 0 1.7 3h11a2 2 0 0 0 1.7-3l-4.8-8V3.2" />
      <path d="M8.1 3.2h7.8" />
    </NavIcon>
  );
}

function SavedBlendsIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M9 3h6v3H9V3z" />
      <path d="M8 6h8l-1 14H9L8 6z" />
      <path d="M10 11h4" />
    </NavIcon>
  );
}

function WishlistIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M12 20.3s-7.3-4.5-9.8-9C.8 7.8 2.3 4.5 5.4 4.5c1.9 0 3.5 1.1 4.6 2.7 1.1-1.6 2.7-2.7 4.6-2.7 3.1 0 4.6 3.3 3.2 6.8-2.5 4.5-9.8 9-9.8 9z" />
    </NavIcon>
  );
}

function CartIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <path d="M6 7h12l-1 12H7L6 7z" />
      <path d="M9.5 9V6a2.5 2.5 0 0 1 5 0v3" />
    </NavIcon>
  );
}

function AccountIcon(props: IconProps) {
  return (
    <NavIcon {...props}>
      <circle cx="12" cy="8.5" r="3.3" />
      <path d="M5 20c1.2-3.8 4-5.7 7-5.7s5.8 1.9 7 5.7" />
    </NavIcon>
  );
}

const LINKS: Array<{
  href: string;
  label: string;
  Icon: ComponentType<IconProps>;
}> = [
  { href: "/shop", label: "Shop", Icon: ShopIcon },
  { href: "/collections", label: "Collections", Icon: CollectionsIcon },
  { href: "/bespoke", label: "Bespoke", Icon: BespokeIcon },
  { href: "/bespoke/saved", label: "Saved blends", Icon: SavedBlendsIcon },
  { href: "/wishlist", label: "Wishlist", Icon: WishlistIcon },
  { href: "/cart", label: "Cart", Icon: CartIcon },
  { href: ACCOUNT_HOME, label: "Account", Icon: AccountIcon },
];

/**
 * Phone drawer rows — same label list as before, with the header's own
 * stroke icons so WhatsApp is not the only row with a mark.
 */
export function HeaderMobileNav({
  tone = "dark",
  onNavigate,
}: {
  tone?: NavLinkTone;
  onNavigate: () => void;
}) {
  const light = tone === "light";

  return (
    <div className="flex flex-col py-3">
      {LINKS.map(({ href, label, Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 border-b py-4 text-lg",
            light
              ? "border-graphite/10 font-editorial text-graphite"
              : "border-cream/8 font-display text-cream-soft",
          )}
        >
          <Icon />
          {label}
        </Link>
      ))}
      <HeaderWhatsAppLink tone={tone} onNavigate={onNavigate} />
    </div>
  );
}
