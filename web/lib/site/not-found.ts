import type { NotFoundAction } from "@/components/site/not-found-view";
import { ADMIN_HOME } from "@/lib/auth/admin-routes";

export type NotFoundPreset = {
  title: string;
  description: string;
  actions: NotFoundAction[];
};

/** Shop / marketing 404 — home + catalogue. */
export const SHOP_NOT_FOUND: NotFoundPreset = {
  title: "Page not found",
  description:
    "This page does not exist, or it may have moved. Head home or browse the shop.",
  actions: [
    { href: "/", label: "Go to home", variant: "emphasis" },
    { href: "/shop", label: "Browse shop", variant: "outline" },
  ],
};

/** Admin dashboard 404 — back to the console. */
export const ADMIN_NOT_FOUND: NotFoundPreset = {
  title: "Page not found",
  description:
    "This admin page does not exist, or the link is out of date.",
  actions: [
    { href: ADMIN_HOME, label: "Go to dashboard", variant: "emphasis" },
  ],
};
