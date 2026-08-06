"use client";

import { useState } from "react";
import { ContactSection } from "@/components/checkout/contact-section";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { validateContact } from "@/lib/checkout/checkout-validation";
import { updateMe } from "@/lib/customers/me-client";
import type { CustomerSummary } from "@ishraqparfums/shared";

/**
 * Full-page gate when name/email are missing. Persists via PATCH /me, then unlocks checkout.
 */
export function CheckoutProfileGate({
  phone,
  initialName,
  initialEmail,
  onComplete,
}: {
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
    <div className="mx-auto max-w-lg">
      <header>
        <h1 className="font-display text-[clamp(1.85rem,3.2vw,2.5rem)] font-semibold tracking-[-0.025em] text-ink">
          Almost there
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
          Where should we send your order confirmation?
        </p>
      </header>

      <p className="mt-6 font-mono text-label-sm uppercase tracking-wide text-ink-faint">
        Signed in as{" "}
        <span className="normal-case tracking-normal text-ink">{phone}</span>
      </p>

      <div className="mt-8">
        <ContactSection
          name={name}
          email={email}
          nameError={liveErrors.name}
          emailError={liveErrors.email}
          disabled={saving}
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

      <Button
        type="button"
        variant="emphasis"
        size="lg"
        disabled={saving}
        className="mt-8 w-full cursor-pointer sm:w-auto sm:min-w-[16rem]"
        onClick={() => {
          void onContinue();
        }}
      >
        {saving ? "Saving…" : "Continue to checkout"}
      </Button>
    </div>
  );
}
