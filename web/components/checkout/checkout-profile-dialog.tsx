"use client";

import { useState } from "react";
import type { CustomerSummary } from "@ishraqparfums/shared";
import { formatIndianMobileDisplay } from "@ishraqparfums/shared";
import { ContactSection } from "@/components/checkout/contact-section";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { validateContact } from "@/lib/checkout/checkout-validation";
import { updateMe } from "@/lib/customers/me-client";

/**
 * Required profile complete — name + email over dimmed checkout.
 * Not dismissible until saved.
 */
export function CheckoutProfileDialog({
  open,
  phone,
  initialName,
  initialEmail,
  onComplete,
}: {
  open: boolean;
  phone: string;
  initialName?: string;
  initialEmail?: string;
  onComplete: (me: CustomerSummary) => void;
}) {
  const [name, setName] = useState(initialName ?? "");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [attempted, setAttempted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);

  const liveErrors = attempted ? errors : {};

  async function onContinue() {
    setAttempted(true);
    const next = validateContact(name, email);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const me = await updateMe({ name, email });
      onComplete(me);
    } catch (err) {
      toast.error(
        "Could not save details",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="A few details"
      dismissible={false}
      theme="v2"
      panelClassName="max-w-xl"
      footer={
        <Button
          type="button"
          variant="ink"
          size="lg"
          disabled={saving}
          className="w-full cursor-pointer"
          onClick={() => {
            void onContinue();
          }}
        >
          {saving ? "Saving…" : "Continue"}
        </Button>
      }
    >
      <p className="text-[15px] leading-relaxed text-graphite-soft">
        So we can send your order confirmation.
      </p>

      <p className="mt-4 font-ui text-[11px] uppercase tracking-[0.14em] text-graphite-faint">
        Signed in as{" "}
        <span className="normal-case tracking-normal text-graphite">
          {formatIndianMobileDisplay(phone)}
        </span>
      </p>

      <div className="mt-5">
        <ContactSection
          name={name}
          email={email}
          nameError={liveErrors.name}
          emailError={liveErrors.email}
          disabled={saving}
          showHeading={false}
          onNameChange={(value) => {
            setName(value);
            if (attempted) setErrors(validateContact(value, email));
          }}
          onEmailChange={(value) => {
            setEmail(value);
            if (attempted) setErrors(validateContact(name, value));
          }}
        />
      </div>
    </Modal>
  );
}
