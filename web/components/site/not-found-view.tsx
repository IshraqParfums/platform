import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { cn } from "@/lib/cn";

export type NotFoundAction = {
  href: string;
  label: string;
  variant?: "emphasis" | "outline" | "primary";
};

/**
 * Shared 404 composition — one place for copy layout and CTAs.
 * Route `not-found.tsx` files pick a preset and render this.
 */
export function NotFoundView({
  code = "404",
  title,
  description,
  actions,
  className,
  children,
}: {
  code?: string;
  title: string;
  description: string;
  actions: NotFoundAction[];
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Section tone="cream-soft" space="default" className={cn("flex-1", className)}>
      <Container size="narrow">
        <div className="mx-auto flex max-w-lg flex-col items-start text-left">
          <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            {code}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base text-ink-soft md:text-lg">{description}</p>

          {children}

          <div className="mt-8 flex flex-wrap gap-3">
            {actions.map((action) => (
              <ButtonLink
                key={action.href + action.label}
                href={action.href}
                variant={action.variant ?? "emphasis"}
                size="md"
              >
                {action.label}
              </ButtonLink>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
