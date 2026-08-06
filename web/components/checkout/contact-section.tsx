"use client";

import { FormField, SectionHeading } from "@/components/checkout/form-field";
import { FormInput } from "@/components/checkout/form-input";
import { checkoutLayout } from "@/components/checkout/checkout-layout";
import { cn } from "@/lib/cn";

export function ContactSection({
  name,
  email,
  nameError,
  emailError,
  disabled,
  showHeading = true,
  onNameChange,
  onEmailChange,
}: {
  name: string;
  email: string;
  nameError?: string;
  emailError?: string;
  disabled?: boolean;
  showHeading?: boolean;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}) {
  return (
    <section
      aria-labelledby={showHeading ? "checkout-contact-heading" : undefined}
      aria-label={showHeading ? undefined : "Contact details"}
    >
      {showHeading ? (
        <SectionHeading
          id="checkout-contact-heading"
          title="Contact"
          description="We’ll send your order confirmation here."
        />
      ) : null}

      <div
        className={cn(
          "grid sm:grid-cols-2",
          showHeading && checkoutLayout.sectionToContent,
          checkoutLayout.fieldGrid,
        )}
      >
        <FormField
          label="Full name"
          htmlFor="checkout-contact-name"
          error={nameError}
        >
          <FormInput
            id="checkout-contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            disabled={disabled}
            value={name}
            invalid={Boolean(nameError)}
            onChange={(event) => onNameChange(event.target.value)}
          />
        </FormField>

        <FormField
          label="Email"
          htmlFor="checkout-contact-email"
          error={emailError}
        >
          <FormInput
            id="checkout-contact-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            disabled={disabled}
            value={email}
            invalid={Boolean(emailError)}
            onChange={(event) => onEmailChange(event.target.value)}
          />
        </FormField>
      </div>
    </section>
  );
}
