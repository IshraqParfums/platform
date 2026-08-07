"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";

type AdminListPendingValue = {
  isPending: boolean;
  push: (href: string) => void;
  refresh: () => void;
};

const AdminListPendingContext = createContext<AdminListPendingValue | null>(
  null,
);

export function AdminListPendingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const value: AdminListPendingValue = {
    isPending,
    push: (href) => {
      startTransition(() => {
        router.push(href);
      });
    },
    refresh: () => {
      startTransition(() => {
        router.refresh();
      });
    },
  };

  return (
    <AdminListPendingContext.Provider value={value}>
      {children}
    </AdminListPendingContext.Provider>
  );
}

export function useAdminListPending(): AdminListPendingValue {
  const ctx = useContext(AdminListPendingContext);
  if (!ctx) {
    throw new Error(
      "useAdminListPending must be used within AdminListPendingProvider",
    );
  }
  return ctx;
}
