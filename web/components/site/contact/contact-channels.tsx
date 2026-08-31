import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { CONTACT_CHANNELS, getSiteContact } from "@/lib/site/contact";
import { cn } from "@/lib/cn";

/**
 * Two equal channel cards — WhatsApp primary, email secondary. Borders and a
 * quiet shadow only; no fills that read as a SaaS pricing table.
 */
export function ContactChannels() {
  const contact = getSiteContact();
  const { whatsapp, email } = CONTACT_CHANNELS;

  return (
    <div className="grid gap-5 md:grid-cols-2 md:gap-6 lg:gap-8">
      <Reveal delay={60}>
        <ChannelCard>
          <ChannelHeader label={whatsapp.label} blurb={whatsapp.blurb} uses={whatsapp.uses} />
          <div className="mt-auto flex flex-col items-start gap-3 pt-8">
            <ButtonLink
              href={contact.whatsappUrl}
              variant="ink"
              size="lg"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
              {whatsapp.cta}
            </ButtonLink>
            <p className="font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
              {contact.whatsappDisplay}
            </p>
          </div>
        </ChannelCard>
      </Reveal>

      <Reveal delay={120}>
        <ChannelCard>
          <ChannelHeader label={email.label} blurb={email.blurb} uses={email.uses} />
          <div className="mt-auto flex flex-col items-start gap-3 pt-8">
            <ButtonLink href={contact.mailtoUrl} variant="outline-paper" size="lg">
              {email.cta}
            </ButtonLink>
            <a
              href={contact.mailtoUrl}
              className="text-[14.5px] text-graphite-soft underline decoration-graphite/20 underline-offset-4 transition-colors hover:text-terra hover:decoration-terra/50"
            >
              {contact.email}
            </a>
          </div>
        </ChannelCard>
      </Reveal>
    </div>
  );
}

function ChannelCard({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-[4px] border border-graphite/10 bg-shell px-7 py-8",
        "shadow-[0_18px_44px_-30px_rgba(22,19,16,0.42)] transition-[border-color] duration-200 hover:border-graphite/20",
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
      <h2 className="font-editorial text-[24px] leading-snug text-graphite">
        {label}
      </h2>
      <p className="mt-3 text-[15.5px] leading-relaxed text-graphite-soft">{blurb}</p>
      <ul className="mt-6 space-y-2 text-[15px] leading-relaxed text-graphite-soft">
        {uses.map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <span aria-hidden className="h-px w-3 shrink-0 bg-terra/60" />
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
