"use client";

import { useEffect, useState } from "react";
import type { CustomerSummary } from "@ishraqparfums/shared";
import { formatIndianMobileDisplay } from "@ishraqparfums/shared";
import { ContactSection } from "@/components/checkout/contact-section";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/components/ui/toaster";
import { validateContact } from "@/lib/checkout/checkout-validation";
import { updateMe } from "@/lib/customers/me-client";

/**
 * Edit name + email on Account. Phone stays identity and is not editable here.
 */
export function ProfileEditModal({
  open,
  me,
  onClose,
  onSaved,
}: {
  open: boolean;
  me: CustomerSummary;
  onClose: () => void;
  onSaved: (me: CustomerSummary) => void;
}) {
  const [name, setName] = useState(me.name ?? "");
  const [email, setEmail] = useState(me.email ?? "");
  const [attempted, setAttempted] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(me.name ?? "");
    setEmail(me.email ?? "");
    setAttempted(false);
    setErrors({});
    setSaving(false);
  }, [open, me.name, me.email]);

  const liveErrors = attempted ? errors : {};

  async function onSave() {
    setAttempted(true);
    const next = validateContact(name, email);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateMe({ name, email });
      toast.success("Details saved");
      onSaved(updated);
      onClose();
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
      title="Edit details"
      dismissible={!saving}
      onClose={onClose}
      panelClassName="max-w-xl"
      footer={
        <div className="flex flex-col gap-2.5 sm:flex-row-reverse">
          <Button
            type="button"
            variant="emphasis"
            size="md"
            disabled={saving}
            className="w-full cursor-pointer sm:w-auto"
            onClick={() => {
              void onSave();
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="md"
            disabled={saving}
            className="w-full cursor-pointer text-ink-soft sm:w-auto"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
        Signed in as{" "}
        <span className="normal-case tracking-normal text-ink">
          {formatIndianMobileDisplay(me.phone)}
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
