import type { ReactNode } from "react";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { redirectToAdminLogin } from "@/lib/admin/admin-page-fetch";
import { getAdminAccessToken } from "@/lib/auth/session";

export default async function AdminDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await getAdminAccessToken())) {
    await redirectToAdminLogin();
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <SidebarNav />
      <main className="min-h-dvh min-w-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8 md:px-10">
        {children}
      </main>
    </div>
  );
}

