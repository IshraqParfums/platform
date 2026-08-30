"use client";

import { CheckoutField } from "@/components/checkout/checkout-field";
import { CheckoutInput } from "@/components/checkout/checkout-input";
import { CheckoutHeading } from "@/components/checkout/checkout-heading";
import { checkoutLayoutV2 } from "@/components/checkout/checkout-layout-v2";
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
        <CheckoutHeading
          id="checkout-contact-heading"
          title="Contact"
          description="We’ll send your order confirmation here."
        />
      ) : null}

      <div
        className={cn(
          "grid sm:grid-cols-2",
          showHeading && checkoutLayoutV2.sectionToContent,
          checkoutLayoutV2.fieldGrid,
        )}
      >
        <CheckoutField
          label="Full name"
          htmlFor="checkout-contact-name"
          error={nameError}
        >
          <CheckoutInput
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
        </CheckoutField>

        <CheckoutField
          label="Email"
          htmlFor="checkout-contact-email"
          error={emailError}
        >
          <CheckoutInput
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
        </CheckoutField>
      </div>
    </section>
  );
}
