import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm rounded-lg border border-ink/10 bg-card p-8">
        <h1 className="font-display text-xl font-semibold text-ink">
          Ishraq Admin
        </h1>
        <p className="mt-1 text-sm text-ink-faint">
          Sign in to manage orders, products and customers.
        </p>
        <div className="mt-6">
          <Suspense
            fallback={
              <p className="font-mono text-label-sm uppercase text-ink-faint">
                Checking your session…
              </p>
            }
          >
            <AdminLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
