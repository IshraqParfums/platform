"use client";

import {
  Beaker,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeft,
  PanelLeftClose,
  ShoppingBag,
  Store,
  Tags,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/collections", label: "Collections", icon: Tags },
  { href: "/admin/bespoke", label: "Bespoke", icon: FlaskConical },
  { href: "/admin/bespoke/atelier", label: "Atelier", icon: Beaker, exact: true },
  { href: "/admin/customers", label: "Customers", icon: Users },
];

const STORAGE_KEY = "admin-sidebar-collapsed";

function Monogram() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/50 font-display text-[15px] font-semibold text-gold-soft">
      I
    </span>
  );
}

function NavLinks({
  pathname,
  collapsed,
  onNavigate,
}: {
  pathname: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
              collapsed && "justify-center px-2",
              active
                ? "bg-cream/10 text-cream-soft"
                : "text-cream/65 hover:bg-cream/5 hover:text-cream-soft",
            )}
          >
            <Icon
              className={cn("size-4 shrink-0", active && "text-gold-soft")}
              aria-hidden
            />
            {!collapsed ? <span>{item.label}</span> : null}
            {collapsed ? <span className="sr-only">{item.label}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      setSignOutOpen(false);
      router.replace("/admin/login");
      router.refresh();
    }
  }

  const railCollapsed = collapsed && !open;

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gold/15 bg-deep px-4 py-3 text-cream-soft md:hidden">
        <div className="flex items-center gap-3">
          <Monogram />
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold">Ishraq</p>
            <p className="font-mono text-label-sm uppercase tracking-wide text-gold-soft/75">
              Admin
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setOpen(true)}
          className="cursor-pointer rounded-md p-2 text-cream-soft hover:bg-cream/10"
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </div>

      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-deep/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-dvh w-64 shrink-0 flex-col border-r border-gold/15 bg-deep text-cream-soft transition-[width,transform] duration-200",
          "md:sticky md:top-0 md:translate-x-0",
          collapsed ? "md:w-16" : "md:w-64",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        <div
          className={cn(
            "flex shrink-0 items-center border-b border-cream/8",
            railCollapsed
              ? "flex-col gap-2 px-2 py-3"
              : "justify-between gap-2 px-4 py-4",
          )}
        >
          <div
            className={cn(
              "flex min-w-0 items-center gap-3",
              railCollapsed && "justify-center",
            )}
          >
            <Monogram />
            {!railCollapsed ? (
              <div className="leading-tight">
                <p className="font-display text-[15px] font-semibold">Ishraq</p>
                <p className="font-mono text-label-sm uppercase tracking-wide text-gold-soft/75">
                  Admin
                </p>
              </div>
            ) : (
              <span className="sr-only">Ishraq Admin</span>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-center gap-1">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-md p-1.5 text-cream/65 hover:bg-cream/10 hover:text-cream-soft md:hidden"
            >
              <X className="size-5" aria-hidden />
            </button>
            <button
              type="button"
              onClick={toggleCollapsed}
              className="hidden cursor-pointer rounded-md p-1.5 text-cream/65 transition-colors hover:bg-cream/10 hover:text-cream-soft md:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? (
                <PanelLeft className="size-4" aria-hidden />
              ) : (
                <PanelLeftClose className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <NavLinks
          pathname={pathname}
          collapsed={railCollapsed}
          onNavigate={() => setOpen(false)}
        />

        <div className="shrink-0 space-y-1 border-t border-cream/8 px-3 py-4">
          <Link
            href="/shop"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            title={railCollapsed ? "Visit shop" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-cream/65 transition-colors hover:bg-cream/5 hover:text-cream-soft",
              railCollapsed && "justify-center px-2",
            )}
          >
            <Store className="size-4 shrink-0" aria-hidden />
            {!railCollapsed ? <span>Visit shop</span> : null}
            {railCollapsed ? <span className="sr-only">Visit shop</span> : null}
          </Link>
          <button
            type="button"
            disabled={signingOut}
            onClick={() => setSignOutOpen(true)}
            title={railCollapsed ? "Sign out" : undefined}
            className={cn(
              "flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-cream/65 transition-colors hover:bg-cream/5 hover:text-cream-soft disabled:opacity-60",
              railCollapsed && "justify-center px-2",
            )}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            {!railCollapsed ? <span>Sign out</span> : null}
            {railCollapsed ? <span className="sr-only">Sign out</span> : null}
          </button>
        </div>
      </aside>

      <Modal
        open={signOutOpen}
        title="Sign out"
        onClose={() => {
          if (!signingOut) setSignOutOpen(false);
        }}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              size="md"
              disabled={signingOut}
              onClick={() => setSignOutOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="emphasis"
              size="md"
              disabled={signingOut}
              onClick={() => void signOut()}
              className="cursor-pointer"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-ink-soft">Sign out of the admin console?</p>
      </Modal>
    </>
  );
}
