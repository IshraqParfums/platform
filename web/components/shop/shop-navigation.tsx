"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

type ShopNavigateOptions = {
  /** `replace` for search typing; `push` for discrete filter/sort changes. */
  replace?: boolean;
};

type ShopNavigationContextValue = {
  isPending: boolean;
  navigate: (href: string, options?: ShopNavigateOptions) => void;
};

const ShopNavigationContext = createContext<ShopNavigationContextValue | null>(
  null,
);

/**
 * Soft shop navigations share one transition so search, sort, and chips can
 * dim the results grid while the RSC payload refreshes.
 */
export function ShopNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function navigate(href: string, options?: ShopNavigateOptions) {
    startTransition(() => {
      if (options?.replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    });
  }

  return (
    <ShopNavigationContext.Provider value={{ isPending, navigate }}>
      {children}
    </ShopNavigationContext.Provider>
  );
}

export function useShopNavigate() {
  const value = useContext(ShopNavigationContext);
  if (!value) {
    throw new Error("useShopNavigate must be used within ShopNavigationProvider");
  }
  return value;
}
