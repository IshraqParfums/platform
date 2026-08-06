"use client";

import { useState } from "react";
import { ContactSection } from "@/components/checkout/contact-section";
import { SectionHeading } from "@/components/checkout/form-field";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { validateContact } from "@/lib/checkout/checkout-validation";
import { updateMe } from "@/lib/customers/me-client";
import type { CustomerSummary } from "@ishraqparfums/shared";

/**
 * Compact receipt contact when profile is complete. Edit expands inline and PATCH /me.
 */
export function ContactSummary({
  name,
  email,
  phone,
  disabled,
  onSaved,
}: {
  name: string;
  email: string;
  phone: string;
  disabled?: boolean;
  onSaved: (me: CustomerSummary) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftEmail, setDraftEmail] = useState(email);
  const [attempted, setAttempted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);

  function startEdit() {
    setDraftName(name);
    setDraftEmail(email);
    setAttempted(false);
    setErrors({});
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setAttempted(false);
    setErrors({});
  }

  async function saveEdit() {
    setAttempted(true);
    const next = validateContact(draftName, draftEmail);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const me = await updateMe({ name: draftName, email: draftEmail });
      onSaved(me);
      setEditing(false);
      toast.success("Contact updated");
    } catch (err) {
      toast.error(
        "Could not update contact",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setSaving(false);
    }
  }

  const liveErrors = attempted ? errors : {};

  return (
    <section aria-labelledby="checkout-contact-summary-heading">
      <SectionHeading
        id="checkout-contact-summary-heading"
        title="Contact"
        action={
          !editing ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              className="cursor-pointer text-ink-soft"
              onClick={startEdit}
            >
              Edit
            </Button>
          ) : null
        }
      />

      {!editing ? (
        <div className="mt-4 text-sm leading-relaxed text-ink-soft">
          <p className="text-ink">
            <span className="font-medium">{name}</span>
            <span className="text-ink-faint"> · </span>
            {email}
          </p>
          <p className="mt-1 font-mono text-label-sm uppercase tracking-wide text-ink-faint">
            Signed in as{" "}
            <span className="normal-case tracking-normal text-ink-soft">
              {phone}
            </span>
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <ContactSection
            name={draftName}
            email={draftEmail}
            nameError={liveErrors.name}
            emailError={liveErrors.email}
            disabled={saving || disabled}
            showHeading={false}
            onNameChange={(value) => {
              setDraftName(value);
              if (attempted) setErrors(validateContact(value, draftEmail));
            }}
            onEmailChange={(value) => {
              setDraftEmail(value);
              if (attempted) setErrors(validateContact(draftName, value));
            }}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              type="button"
              variant="emphasis"
              size="md"
              disabled={saving || disabled}
              className="cursor-pointer"
              onClick={() => {
                void saveEdit();
              }}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              disabled={saving || disabled}
              className="cursor-pointer"
              onClick={cancelEdit}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
