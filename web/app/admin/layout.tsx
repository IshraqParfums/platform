import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-cream-soft text-ink">
      {children}
      <Toaster />
    </div>
  );
}
