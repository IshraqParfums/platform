import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * Way back up a route. Reads as a link — sans, sentence case, an underline that
 * arrives on hover — rather than as another mono label competing with the page's
 * own eyebrows. The arrow eases left on hover, which is the whole animation.
 */
export function BackLink({
  href,
  children,
  className,
}: {
  href: string;
  children: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-2 text-sm font-medium text-ink-soft",
        "underline decoration-transparent decoration-1 underline-offset-4",
        "transition-colors duration-200 hover:text-ink hover:decoration-ink/35",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink/30",
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
