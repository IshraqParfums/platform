import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { CONTACT_CHANNELS, getSiteContact } from "@/lib/site/contact";
import { cn } from "@/lib/cn";

/**
 * Two equal premium channel cards — WhatsApp primary (gold CTA), email secondary.
 * Borders only; no shadows or fills that read as SaaS cards.
 */
export function ContactChannels() {
  const contact = getSiteContact();
  const { whatsapp, email } = CONTACT_CHANNELS;

  return (
    <Section
      tone="cream"
      space="default"
      className="!pt-10 md:!pt-14 !pb-16 md:!pb-24"
    >
      <Container size="default">
        <Reveal>
          <SectionHeading
            title="Reach Us At"
            description="Message the people who compose and bottle every fragrance — not a ticket queue."
          />
        </Reveal>

        <div className="mt-10 grid gap-5 md:mt-12 md:grid-cols-2 md:gap-6 lg:gap-8">
          <Reveal delay={60}>
            <ChannelCard>
              <ChannelHeader
                label={whatsapp.label}
                blurb={whatsapp.blurb}
                uses={whatsapp.uses}
              />
              <div className="mt-auto flex flex-col items-start gap-3 pt-8">
                <ButtonLink
                  href={contact.whatsappUrl}
                  variant="emphasis"
                  size="lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon />
                  {whatsapp.cta}
                </ButtonLink>
                <p className="font-mono text-label-sm text-ink-faint">
                  {contact.whatsappDisplay}
                </p>
              </div>
            </ChannelCard>
          </Reveal>

          <Reveal delay={120}>
            <ChannelCard>
              <ChannelHeader
                label={email.label}
                blurb={email.blurb}
                uses={email.uses}
              />
              <div className="mt-auto flex flex-col items-start gap-3 pt-8">
                <ButtonLink
                  href={contact.mailtoUrl}
                  variant="outline"
                  size="lg"
                >
                  {email.cta}
                </ButtonLink>
                <a
                  href={contact.mailtoUrl}
                  className="text-[14.5px] text-ink-soft underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink/50"
                >
                  {contact.email}
                </a>
              </div>
            </ChannelCard>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}

function ChannelCard({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border border-ink/12 bg-cream px-7 py-8",
        "transition-[border-color] duration-200 hover:border-ink/25",
        "md:px-9 md:py-10",
      )}
    >
      {children}
    </div>
  );
}

function ChannelHeader({
  label,
  blurb,
  uses,
}: {
  label: string;
  blurb: string;
  uses: readonly string[];
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink">
        {label}
      </h2>
      <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">{blurb}</p>
      <ul className="mt-6 space-y-2 text-[15px] leading-relaxed text-ink-soft">
        {uses.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span
              className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-ink/35"
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.1 14.9l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 0 1 12 4zm-3.4 4.3c-.2 0-.5.1-.7.4-.2.3-.9.9-.9 2.1s.9 2.4 1 2.6c.1.2 1.7 2.7 4.3 3.7 2.1.8 2.5.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3l-2-1c-.3-.1-.5-.1-.7.1l-.7.9c-.1.2-.3.2-.5.1-.3-.1-1.2-.5-2.2-1.4-.8-.7-1.3-1.6-1.5-1.9-.1-.2 0-.4.1-.5l.5-.6c.1-.2.2-.3.3-.5v-.5l-.8-1.9c-.2-.5-.4-.4-.5-.4z" />
    </svg>
  );
}
