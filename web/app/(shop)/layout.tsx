import type { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { HEADER_HEIGHT_PX } from "@/lib/layout";

/**
 * Offsets page content below the fixed header. The home hero pulls back with
 * a negative margin so photography still sits under the transparent nav.
 */
export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ paddingTop: HEADER_HEIGHT_PX }}>
      {children}
      <Toaster />
    </div>
  );
}
