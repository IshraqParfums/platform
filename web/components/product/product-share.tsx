"use client";

import type { ReactNode } from "react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import {
  Check,
  Link2,
  Mail,
  MessageCircle,
  Send,
  Share2,
} from "lucide-react";
import { buildShareLinks } from "@/lib/share/share-links";
import { cn } from "@/lib/cn";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.727-8.836L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

/**
 * Circular share control with a channel popover (WhatsApp, Telegram, X, Email, Copy).
 * Prefers the Web Share API on supporting devices; falls back to the menu.
 */
export function ProductShare({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied — leave menu open.
    }
  }

  async function onTriggerClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    const url = window.location.href;
    const preferNativeShare =
      typeof navigator.share === "function" &&
      window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;

    if (preferNativeShare) {
      try {
        await navigator.share({ title, url, text: title });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    setOpen((prev) => !prev);
  }

  const links =
    open && typeof window !== "undefined"
      ? buildShareLinks(title, window.location.href)
      : null;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={onTriggerClick}
        aria-label="Share this product"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className={cn(
          "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full",
          "border border-ink/25 text-ink transition-colors",
          "hover:border-ink/50 hover:bg-ink/5",
          open && "border-ink/50 bg-ink/5",
        )}
      >
        <Share2 className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
      </button>

      {open && links ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Share options"
          className="absolute right-0 z-20 mt-2 min-w-[11.5rem] border border-ink/15 bg-cream-soft py-1.5 shadow-[0_8px_24px_rgba(28,22,18,0.08)]"
        >
          <ShareMenuLink href={links.whatsapp} label="WhatsApp" onNavigate={() => setOpen(false)}>
            <MessageCircle className="h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.75} />
          </ShareMenuLink>
          <ShareMenuLink href={links.telegram} label="Telegram" onNavigate={() => setOpen(false)}>
            <Send className="h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.75} />
          </ShareMenuLink>
          <ShareMenuLink href={links.x} label="X" onNavigate={() => setOpen(false)}>
            <XIcon className="h-3.5 w-3.5 shrink-0 text-ink-soft" />
          </ShareMenuLink>
          <ShareMenuLink href={links.email} label="Email" onNavigate={() => setOpen(false)}>
            <Mail className="h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.75} />
          </ShareMenuLink>
          <button
            type="button"
            role="menuitem"
            className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:bg-ink/5"
            onClick={() => {
              void copyLink();
            }}
          >
            {copied ? (
              <Check className="h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.75} />
            ) : (
              <Link2 className="h-4 w-4 shrink-0 text-ink-soft" strokeWidth={1.75} />
            )}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function ShareMenuLink({
  href,
  label,
  onNavigate,
  children,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
  children: ReactNode;
}) {
  return (
    <a
      role="menuitem"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:bg-ink/5"
      onClick={onNavigate}
    >
      {children}
      {label}
    </a>
  );
}
