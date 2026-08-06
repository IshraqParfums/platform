import type { ReactNode } from "react";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/cn";

/**
 * Shared shell for storefront static pages (privacy, terms, …).
 * Contact uses its own two-column layout; legal pages stay narrow for reading.
 *
 * Keeps typography, width, and spacing consistent without per-page layout drift.
 */
export function StaticPage({
  eyebrow,
  title,
  description,
  meta,
  children,
  className,
  size = "narrow",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** e.g. effective date under the title. */
  meta?: string;
  children: ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow" | "form";
}) {
  return (
    <Section space="default" className="!pt-10 md:!pt-14 !pb-16 md:!pb-24">
      <Container size={size} className={cn(className)}>
        <header className="max-w-2xl">
          {eyebrow ? (
            <Eyebrow tone="rose" className="mb-4">
              {eyebrow}
            </Eyebrow>
          ) : null}
          <h1 className="font-display text-section font-semibold text-ink">
            {title}
          </h1>
          {meta ? (
            <p className="mt-3 font-mono text-label-sm uppercase tracking-wide text-ink-faint">
              {meta}
            </p>
          ) : null}
          {description ? (
            <p className="mt-5 text-[15.5px] leading-relaxed text-ink-soft">
              {description}
            </p>
          ) : null}
        </header>

        <div className="mt-10 md:mt-12">{children}</div>
      </Container>
    </Section>
  );
}
