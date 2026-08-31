import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

type Theme = "v1" | "v2";

/**
 * Text tone per surface, keyed by theme rather than merged via `className` —
 * a themed lookup, not an override, for the same reason `ui/modal.tsx`'s
 * `THEMES` map is: `cn()` doesn't resolve a conflicting `text-*` passed in
 * from outside. `v1` (default) keeps every existing call site (admin's
 * `AdminBackLink` included) pixel-identical.
 */
const THEMES: Record<Theme, string> = {
  v1: "text-ink-soft hover:text-ink hover:decoration-ink/35 focus-visible:outline-ink/30",
  v2: "text-graphite-soft hover:text-terra hover:decoration-terra/40 focus-visible:outline-graphite/30",
};

/**
 * Way back up a route. Reads as a link — sans, sentence case, an underline that
 * arrives on hover — rather than as another mono label competing with the page's
 * own eyebrows. The arrow eases left on hover, which is the whole animation.
 */
export function BackLink({
  href,
  children,
  className,
  theme = "v1",
}: {
  href: string;
  children: string;
  className?: string;
  theme?: Theme;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-medium",
        "underline decoration-transparent decoration-1 underline-offset-4",
        "transition-colors duration-200",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
        THEMES[theme],
        className,
      )}
    >
      <ArrowLeftIcon
        className="size-4 transition-transform duration-200 ease-[cubic-bezier(0.22,0.8,0.28,1)] group-hover:-translate-x-0.5"
        aria-hidden
      />
      {children}
    </Link>
  );
}
