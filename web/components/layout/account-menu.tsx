"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType } from "react";
import { LogOut, Package, User } from "lucide-react";
import { SignOutDialog } from "@/components/account/sign-out-dialog";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ACCOUNT_HOME,
  ACCOUNT_ORDERS,
  loginPath,
} from "@/lib/auth/account-routes";
import { ensureShopSession } from "@/lib/auth/shop-session";
import { cn } from "@/lib/cn";
import { useDismissable } from "@/lib/ui/use-dismissable";

export type AccountMenuTone = "dark" | "light";

/** Same control language as `CartNavLink`/`BespokeSavedNavLink` — colour rides on `tone`. */
const CONTROL: Record<AccountMenuTone, string> = {
  dark: "text-cream/85 hover:bg-cream/10 hover:text-cream-soft",
  light: "text-graphite/75 hover:bg-graphite/[0.06] hover:text-graphite",
};

type MenuStatus = "idle" | "guest" | "signed-in";

/**
 * Header profile control: an icon trigger opening a short destination menu —
 * Orders, Account, and a separated sign-out.
 *
 * Deliberately not a preview of recent orders. Reading three dated rows with
 * statuses and totals is the job `/account/orders` already does properly,
 * and doing it here made the menu a small dashboard the eye had to parse
 * before it could find the two links it came for. Dropping it also drops the
 * orders request entirely: opening the menu now only resolves the session.
 *
 * The session check still runs on every open rather than caching across
 * opens — the header stays mounted across client-side navigation, so a cache
 * could go stale the moment someone signs in or out elsewhere and comes
 * back. A reopen keeps showing the last-known state while the check
 * re-resolves, so a quick close/reopen doesn't flicker; only the very first
 * open (still `"idle"`) shows the skeleton.
 *
 * Sign out goes through the same `SignOutDialog` the Account page uses, so
 * the destructive action is confirmed identically wherever it's reached.
 */
export function AccountMenu({ tone = "dark" }: { tone?: AccountMenuTone }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<MenuStatus>("idle");
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const rootRef = useDismissable<HTMLDivElement>(open, () => setOpen(false));

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    void (async () => {
      const authenticated = await ensureShopSession();
      if (cancelled) return;
      setStatus(authenticated ? "signed-in" : "guest");
    })();

    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative hidden md:block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          CONTROL[tone],
        )}
      >
        <ProfileIcon />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-[60] mt-2 w-60 overflow-hidden rounded-[4px] border border-graphite/10 bg-shell shadow-[0_24px_60px_-30px_rgba(22,19,16,0.55)]"
        >
          {status === "idle" ? (
            <MenuSkeleton />
          ) : status === "guest" ? (
            <div className="p-5">
              <p className="text-[14px] leading-relaxed text-graphite-soft">
                Sign in to see your orders and saved details.
              </p>
              <ButtonLink
                href={loginPath(pathname)}
                variant="ink"
                size="sm"
                className="mt-4 w-full"
                onClick={() => setOpen(false)}
              >
                Sign in
              </ButtonLink>
            </div>
          ) : (
            <>
              <div className="p-1.5">
                <MenuRow
                  href={ACCOUNT_ORDERS}
                  icon={Package}
                  label="Orders"
                  onSelect={() => setOpen(false)}
                />
                <MenuRow
                  href={ACCOUNT_HOME}
                  icon={User}
                  label="Account"
                  onSelect={() => setOpen(false)}
                />
              </div>

              <div className="border-t border-graphite/10 p-1.5">
                <MenuRow
                  icon={LogOut}
                  label="Sign out"
                  tone="terra"
                  onSelect={() => {
                    // Collapse first: the dialog lives outside this subtree
                    // precisely so it survives the dropdown unmounting.
                    setOpen(false);
                    setConfirmingSignOut(true);
                  }}
                />
              </div>
            </>
          )}
        </div>
      ) : null}

      <SignOutDialog
        open={confirmingSignOut}
        onClose={() => setConfirmingSignOut(false)}
        onSignedOut={() => {
          setConfirmingSignOut(false);
          setStatus("guest");
        }}
      />
    </div>
  );
}

/**
 * One destination in the menu, as a link or a button.
 *
 * Sentence-case sans at reading size rather than the 11px tracked-mono label
 * used elsewhere in the chrome: at that size, and with no hover surface, the
 * previous rows read as captions and gave no sign they could be clicked.
 * A full-row hover fill, a leading icon and a real focus ring make the hit
 * area and the affordance visible without turning the menu into a stack of
 * boxed buttons.
 */
function MenuRow({
  href,
  icon: Icon,
  label,
  onSelect,
  tone = "graphite",
}: {
  /** Omit for a button row (sign out). */
  href?: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  onSelect: () => void;
  tone?: "graphite" | "terra";
}) {
  const className = cn(
    "group flex w-full cursor-pointer items-center gap-3 rounded-[3px] px-3 py-2.5 text-left",
    "text-[14px] transition-colors duration-200",
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px]",
    tone === "terra"
      ? "text-terra hover:bg-terra/[0.07] focus-visible:outline-terra/40"
      : "text-graphite hover:bg-paper-deep focus-visible:outline-graphite/30",
  );

  const body = (
    <>
      <Icon
        className={cn(
          "size-[17px] shrink-0 transition-colors duration-200",
          tone === "terra"
            ? "text-terra/70"
            : "text-graphite-faint group-hover:text-terra",
        )}
        strokeWidth={1.6}
      />
      {label}
    </>
  );

  if (!href) {
    return (
      <button
        type="button"
        role="menuitem"
        onClick={onSelect}
        className={className}
      >
        {body}
      </button>
    );
  }

  return (
    <Link href={href} role="menuitem" onClick={onSelect} className={className}>
      {body}
    </Link>
  );
}

function MenuSkeleton() {
  return (
    <div className="space-y-1 p-1.5">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="h-[17px] w-[17px]" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      ))}
    </div>
  );
}

function ProfileIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      className="h-[19px] w-[19px]"
      aria-hidden="true"
    >
      <circle cx="12" cy="8.5" r="3.3" />
      <path
        d="M5 20c1.2-3.8 4-5.7 7-5.7s5.8 1.9 7 5.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
