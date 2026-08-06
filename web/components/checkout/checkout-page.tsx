"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import type { AddressResponse, CustomerSummary } from "@ishraqparfums/shared";
import { AddressSection } from "@/components/checkout/address-section";
import { checkoutLayout } from "@/components/checkout/checkout-layout";
import { CheckoutProfileGate } from "@/components/checkout/checkout-profile-gate";
import { ContactSummary } from "@/components/checkout/contact-summary";
import { OrderSummaryCard } from "@/components/checkout/order-summary-card";
import { PaymentSection } from "@/components/checkout/payment-section";
import { toast } from "@/components/ui/toaster";
import { createAddress, listAddresses } from "@/lib/address/address-client";
import { isShopAuthenticated } from "@/lib/auth/shop-session";
import { loadCart } from "@/lib/cart/cart-client";
import { emitCartChanged } from "@/lib/cart/cart-events";
import {
  cartHasSellableLines,
  type CartView,
} from "@/lib/cart/cart-view";
import { startCheckout } from "@/lib/checkout/checkout-client";
import {
  addressDraftToBody,
  emptyAddressDraft,
  validateAddressDraft,
  validateContact,
  type AddressDraft,
  type AddressDraftErrors,
} from "@/lib/checkout/checkout-validation";
import { getMe } from "@/lib/customers/me-client";
import { isProfileComplete } from "@/lib/customers/profile-complete";
import { cn } from "@/lib/cn";
import {
  pollOrderUntilSettled,
  verifyRazorpayPayment,
} from "@/lib/orders/orders-client";
import {
  openRazorpayCheckout,
  RazorpayDismissedError,
} from "@/lib/payments/razorpay";

/**
 * Checkout orchestrator: profile gate (if needed) → address → sticky summary + pay.
 */
export function CheckoutPageClient() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<CartView | null>(null);
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [me, setMe] = useState<CustomerSummary | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [draft, setDraft] = useState<AddressDraft>(() => emptyAddressDraft());
  const [attempted, setAttempted] = useState(false);
  const [draftErrors, setDraftErrors] = useState<AddressDraftErrors>({});
  const [preparing, setPreparing] = useState(false);
  const [isPending, startTransition] = useTransition();

  const applyProfile = useCallback((profile: CustomerSummary) => {
    setMe(profile);
    setName(profile.name?.trim() ?? "");
    setEmail(profile.email?.trim() ?? "");
  }, []);

  const bootstrap = useCallback(() => {
    startTransition(async () => {
      try {
        const authenticated = await isShopAuthenticated();
        if (!authenticated) {
          router.replace("/login?next=/checkout");
          return;
        }

        const [cart, addressList, profile] = await Promise.all([
          loadCart(),
          listAddresses(),
          getMe(),
        ]);

        if (cart.lines.length === 0 || cart.mode === "guest") {
          router.replace("/cart");
          return;
        }

        setView(cart);
        setAddresses(addressList);
        applyProfile(profile);

        const preferred =
          addressList.find((a) => a.isDefault)?.id ??
          addressList[0]?.id ??
          null;
        setSelectedAddressId(preferred);
        setShowAddressForm(addressList.length === 0);

        setDraft(
          emptyAddressDraft({
            name: profile.name?.trim() || addressList[0]?.name || "",
            phone: profile.phone ?? "+91",
            isDefault: addressList.length === 0,
          }),
        );

        setReady(true);
      } catch {
        toast.error("Could not load checkout");
        router.replace("/cart");
      }
    });
  }, [applyProfile, router]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  function openNewAddressForm() {
    setDraft(
      emptyAddressDraft({
        name: name.trim() || undefined,
        phone: me?.phone ?? "+91",
        isDefault: false,
      }),
    );
    setDraftErrors({});
    setShowAddressForm(true);
    setSelectedAddressId(null);
  }

  function closeNewAddressForm() {
    if (addresses.length === 0) return;
    setShowAddressForm(false);
    setDraftErrors({});
    const preferred =
      addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null;
    setSelectedAddressId(preferred);
  }

  async function resolveAddressId(): Promise<string | null> {
    if (!showAddressForm) {
      return selectedAddressId;
    }

    const errors = validateAddressDraft(draft);
    setDraftErrors(errors);
    if (Object.keys(errors).length > 0) return null;

    const created = await createAddress(addressDraftToBody(draft));
    const next = await listAddresses();
    setAddresses(next);
    setSelectedAddressId(created.id);
    setShowAddressForm(false);
    return created.id;
  }

  async function handlePay() {
    if (!view || preparing) return;

    setAttempted(true);
    const contactErrors = validateContact(name, email);
    if (Object.keys(contactErrors).length > 0) {
      toast.error("Check your contact details");
      return;
    }

    if (!cartHasSellableLines(view)) {
      toast.error("No available items to checkout");
      return;
    }

    if (showAddressForm) {
      const errors = validateAddressDraft(draft);
      setDraftErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error("Complete your delivery address");
        return;
      }
    } else if (!selectedAddressId) {
      toast.error("Select a delivery address");
      return;
    }

    setPreparing(true);
    try {
      const addressId = await resolveAddressId();
      if (!addressId) {
        toast.error("Complete your delivery address");
        return;
      }

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const selected =
        addresses.find((a) => a.id === addressId) ??
        (await listAddresses()).find((a) => a.id === addressId);

      const checkout = await startCheckout({
        addressId,
        name: trimmedName,
        email: trimmedEmail,
      });

      let payment;
      try {
        payment = await openRazorpayCheckout({
          key: checkout.razorpayKeyId,
          razorpayOrderId: checkout.razorpayOrderId,
          amountPaise: checkout.amountPaise,
          customerName: trimmedName,
          customerEmail: trimmedEmail,
          customerPhone: selected?.phone ?? me?.phone ?? draft.phone,
        });
      } catch (err) {
        if (err instanceof RazorpayDismissedError) {
          toast.message("Payment cancelled", "Your cart is still waiting.");
          return;
        }
        throw err;
      }

      try {
        const order = await verifyRazorpayPayment({
          razorpayOrderId: payment.razorpayOrderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          razorpaySignature: payment.razorpaySignature,
        });
        emitCartChanged(0);
        router.replace(`/orders/${order.id}`);
        return;
      } catch {
        toast.message(
          "Confirming payment…",
          "This can take a moment. Please wait.",
        );
        const settled = await pollOrderUntilSettled(checkout.orderId);
        if (settled && settled.status !== "PENDING_PAYMENT") {
          emitCartChanged(0);
          router.replace(`/orders/${settled.id}`);
          return;
        }
        toast.error(
          "Payment received, confirmation pending",
          "Check your orders shortly, or contact us if needed.",
        );
        router.replace(`/orders/${checkout.orderId}`);
      }
    } catch (err) {
      toast.error(
        "Checkout failed",
        err instanceof Error ? err.message : "Please try again",
      );
    } finally {
      setPreparing(false);
    }
  }

  if (!ready || view === null || me === null) {
    return (
      <div className="py-16">
        <p className="font-mono text-label-sm uppercase tracking-wide text-ink-faint">
          {isPending ? "Loading checkout…" : "Preparing…"}
        </p>
      </div>
    );
  }

  if (!isProfileComplete(me)) {
    return (
      <CheckoutProfileGate
        phone={me.phone}
        initialName={me.name ?? ""}
        initialEmail={me.email ?? ""}
        onComplete={(profile) => {
          applyProfile(profile);
          setDraft((prev) => ({
            ...prev,
            name: profile.name?.trim() || prev.name,
            phone: profile.phone || prev.phone,
          }));
        }}
      />
    );
  }

  const liveDraftErrors = attempted && showAddressForm ? draftErrors : {};

  return (
    <div className={checkoutLayout.pageGrid}>
      <div className={cn("min-w-0", checkoutLayout.formStack)}>
        <header className="max-w-xl">
          <h1 className="font-display text-[clamp(1.85rem,3.2vw,2.5rem)] font-semibold tracking-[-0.025em] text-ink">
            Checkout
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">
            Confirm your details and pay securely.
          </p>
        </header>

        <ContactSummary
          name={name}
          email={email}
          phone={me.phone}
          disabled={preparing}
          onSaved={applyProfile}
        />

        <AddressSection
          addresses={addresses}
          selectedId={selectedAddressId}
          showForm={showAddressForm}
          draft={draft}
          draftErrors={liveDraftErrors}
          disabled={preparing}
          onSelect={(id) => {
            setSelectedAddressId(id);
            setShowAddressForm(false);
            setDraftErrors({});
          }}
          onShowForm={openNewAddressForm}
          onHideForm={closeNewAddressForm}
          onDraftChange={(next) => {
            setDraft(next);
            if (attempted) setDraftErrors(validateAddressDraft(next));
          }}
        />
      </div>

      <OrderSummaryCard
        view={view}
        footer={
          <PaymentSection
            totalPaise={view.totalPaise}
            disabled={!cartHasSellableLines(view)}
            preparing={preparing}
            onPay={() => {
              void handlePay();
            }}
          />
        }
      />
    </div>
  );
}
