"use client";

import { CircleHelp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { ACCOUNT_HOME } from "@/lib/auth/account-routes";

/**
 * Quiet receipt confirmation under the checkout header.
 * Opens a short modal explaining where to change the email.
 */
export function CheckoutInvoiceNotice({ email }: { email: string }) {
  const trimmed = email.trim();
  const [open, setOpen] = useState(false);

  if (!trimmed) return null;

  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-graphite/10 pt-4">
        <p className="text-[13px] leading-relaxed text-graphite-soft">
          Invoice will be sent to{" "}
          <span className="font-medium text-graphite">{trimmed}</span>
        </p>
        <button
          type="button"
          aria-label="Where to change invoice email"
          onClick={() => setOpen(true)}
          className="cursor-pointer rounded-full p-0.5 text-graphite-faint transition-colors hover:text-terra"
        >
          <CircleHelp className="size-3.5" aria-hidden />
        </button>
      </div>

      <Modal
        open={open}
        title="Invoice email"
        theme="v2"
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              variant="ink"
              size="md"
              onClick={() => setOpen(false)}
              className="cursor-pointer"
            >
              Got it
            </Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-graphite-soft">
          We email your invoice and order updates to the address on your
          profile. To change it, open{" "}
          <Link
            href={ACCOUNT_HOME}
            className="font-medium text-graphite underline-offset-2 hover:text-terra hover:underline"
            onClick={() => setOpen(false)}
          >
            Account
          </Link>{" "}
          and edit your profile before you pay.
        </p>
      </Modal>
    </>
  );
}
