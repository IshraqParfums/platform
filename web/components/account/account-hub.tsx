"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type {
  AddressResponse,
  CustomerSummary,
  OrderSummary,
} from "@ishraqparfums/shared";
import { formatIndianMobileDisplay } from "@ishraqparfums/shared";
import { AddressDeleteModal } from "@/components/account/address-delete-modal";
import { AddressEditModal } from "@/components/account/address-edit-modal";
import {
  AccountEmpty,
  AccountSection,
} from "@/components/account/account-section";
import { AccountError } from "@/components/account/account-screen";
import { AccountHubSkeleton } from "@/components/account/account-skeletons";
import { OrderCards } from "@/components/account/order-card";
import { ProfileEditModal } from "@/components/account/profile-edit-modal";
import { SignOutButton } from "@/components/account/sign-out-button";
import { FactRecord } from "@/components/checkout/fact-record";
import { Button, ButtonLink } from "@/components/ui/button";
import { listAddresses } from "@/lib/address/address-client";
import { ACCOUNT_ORDERS } from "@/lib/auth/account-routes";
import {
  useGuardedLoad,
} from "@/lib/auth/use-guarded-load";
import { getMe } from "@/lib/customers/me-client";
import { listOrders } from "@/lib/orders/orders-client";

/** Enough recent orders to recognise the account; the rest live on the list. */
const RECENT_ORDERS = 3;

export type HubData = {
  me: CustomerSummary;
  orders: OrderSummary[];
  orderTotal: number;
  ordersFailed: boolean;
  addresses: AddressResponse[];
  addressesFailed: boolean;
};

/**
 * Account lobby: identity, recent orders, addresses, and sign out.
 * Profile and addresses are edited in modals; checkout remains a write path too.
 */
export function AccountHub() {
  const load = useCallback(async (): Promise<HubData> => {
    const [me, orders, addresses] = await Promise.all([
      getMe(),
      listOrders({ page: 1, pageSize: RECENT_ORDERS }).catch(() => null),
      listAddresses().catch(() => null),
    ]);

    return {
      me,
      orders: orders?.items ?? [],
      orderTotal: orders?.total ?? 0,
      ordersFailed: orders === null,
      addresses: addresses ?? [],
      addressesFailed: addresses === null,
    };
  }, []);

  const { state, data, reload } = useGuardedLoad(load);

  if (state === "error") return <AccountError onRetry={reload} />;
  if ((state === "loading" && !data) || !data) {
    return <AccountHubSkeleton />;
  }

  return (
    <AccountHubView
      data={data}
      onRetry={reload}
      onReload={() => reload({ soft: true })}
    />
  );
}

export function AccountHubView({
  data,
  onRetry,
  onReload,
}: {
  data: HubData;
  onRetry: () => void;
  onReload: () => void;
}) {
  const { me, orders, orderTotal, ordersFailed, addresses, addressesFailed } =
    data;
  const displayName = me.name?.trim();

  const [profileOpen, setProfileOpen] = useState(false);
  const [addressEditor, setAddressEditor] = useState<
    AddressResponse | null | "new"
  >(null);
  const [addressToDelete, setAddressToDelete] =
    useState<AddressResponse | null>(null);

  return (
    <div>
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-display text-[clamp(1.85rem,3.2vw,2.5rem)] font-semibold tracking-[-0.025em] text-ink">
            {displayName || "Your account"}
          </h1>
          <p className="mt-2 font-mono text-label-sm uppercase text-ink-faint">
            Signed in as{" "}
            <span className="normal-case tracking-normal text-ink-soft">
              {formatIndianMobileDisplay(me.phone)}
            </span>
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="mt-8 border-t border-ink/[0.08] divide-y divide-ink/[0.08]">
        <AccountSection
          title="Details"
          action={
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="cursor-pointer text-ink-soft"
              onClick={() => setProfileOpen(true)}
            >
              Edit
            </Button>
          }
        >
          <FactRecord
            fields={[
              {
                label: "Name",
                value: displayName || "Not added yet",
                valueClassName: displayName
                  ? "font-medium text-ink"
                  : "text-ink-faint",
              },
              {
                label: "Email",
                value: me.email?.trim() || "Not added yet",
                valueClassName: me.email
                  ? "break-words text-ink-soft"
                  : "text-ink-faint",
              },
              {
                label: "Phone",
                value: formatIndianMobileDisplay(me.phone),
                valueClassName: "tabular-nums text-ink-soft",
              },
            ]}
          />
          {!me.email?.trim() || !displayName ? (
            <p className="mt-4 text-sm text-ink-faint">
              Add these so order confirmations reach you — or we’ll ask at
              checkout.
            </p>
          ) : null}
        </AccountSection>

        <AccountSection
          title="Orders"
          surface="muted"
          action={
            orders.length > 0
              ? {
                  href: ACCOUNT_ORDERS,
                  label:
                    orderTotal > orders.length
                      ? `All ${orderTotal} orders`
                      : "All orders",
                }
              : undefined
          }
        >
          {ordersFailed ? (
            <AccountEmpty>
              Your orders couldn’t be loaded just now.{" "}
              <button
                type="button"
                onClick={onRetry}
                className="cursor-pointer underline decoration-ink/25 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink/50"
              >
                Try again
              </button>
              .
            </AccountEmpty>
          ) : orders.length === 0 ? (
            <div>
              <AccountEmpty>
                Nothing ordered yet. When you do, every order will be here.
              </AccountEmpty>
              <ButtonLink
                href="/shop"
                variant="outline"
                size="md"
                className="mt-6"
              >
                Browse perfumes
              </ButtonLink>
            </div>
          ) : (
            <OrderCards orders={orders} />
          )}
        </AccountSection>

        <AccountSection
          title="Delivery addresses"
          action={
            !addressesFailed ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="cursor-pointer text-ink-soft"
                onClick={() => setAddressEditor("new")}
              >
                Add
              </Button>
            ) : undefined
          }
        >
          {addressesFailed ? (
            <AccountEmpty>
              Your addresses couldn’t be loaded just now.
            </AccountEmpty>
          ) : addresses.length === 0 ? (
            <AccountEmpty>
              No addresses saved yet. Add one here, or you’ll create one at
              checkout.
            </AccountEmpty>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {addresses.map((address) => (
                <li key={address.id}>
                  <AccountAddressCard
                    address={address}
                    onEdit={() => setAddressEditor(address)}
                    onDelete={() => setAddressToDelete(address)}
                  />
                </li>
              ))}
            </ul>
          )}
        </AccountSection>
      </div>

      <p className="mt-10 text-sm text-ink-faint">
        Need help with an order?{" "}
        <Link
          href="/contact"
          className="underline decoration-ink/25 underline-offset-[3px] transition-colors hover:text-ink hover:decoration-ink/50"
        >
          Contact us
        </Link>
        .
      </p>

      <ProfileEditModal
        open={profileOpen}
        me={me}
        onClose={() => setProfileOpen(false)}
        onSaved={() => onReload()}
      />

      <AddressEditModal
        open={addressEditor !== null}
        address={addressEditor === "new" ? null : addressEditor}
        preferDefault={
          addressEditor === "new" && addresses.length === 0
        }
        onClose={() => setAddressEditor(null)}
        onSaved={() => onReload()}
      />

      <AddressDeleteModal
        open={addressToDelete !== null}
        address={addressToDelete}
        onClose={() => setAddressToDelete(null)}
        onDeleted={() => onReload()}
      />
    </div>
  );
}

function AccountAddressCard({
  address,
  onEdit,
  onDelete,
}: {
  address: AddressResponse;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-ink/12 px-5 py-4">
      <p className="flex flex-wrap items-baseline gap-x-2 text-[15px]">
        <span className="font-medium text-ink">{address.name}</span>
        {address.isDefault ? (
          <span className="font-mono text-label-sm uppercase text-ink-faint">
            Default
          </span>
        ) : null}
      </p>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">
        {address.line1}
        {address.line2 ? `, ${address.line2}` : ""}
        <br />
        {address.city}, {address.state} {address.pincode}
        <br />
        {formatIndianMobileDisplay(address.phone)}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onEdit}
          className="cursor-pointer font-mono text-label-sm uppercase text-ink-faint transition-colors hover:text-ink"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="cursor-pointer font-mono text-label-sm uppercase text-ink-faint transition-colors hover:text-ink"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
