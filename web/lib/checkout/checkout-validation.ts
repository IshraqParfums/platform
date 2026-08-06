import type { CreateAddressBody } from "@ishraqparfums/shared";
import {
  isIndianMobileE164,
  normalizeIndianMobile,
} from "@ishraqparfums/shared";

export type AddressDraft = {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export type AddressDraftErrors = Partial<
  Record<keyof AddressDraft, string>
>;

export function emptyAddressDraft(
  initial?: Partial<AddressDraft>,
): AddressDraft {
  return {
    name: "",
    phone: "+91",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: true,
    ...initial,
  };
}

export function addressDraftToBody(draft: AddressDraft): CreateAddressBody {
  const line2 = draft.line2.trim();
  return {
    name: draft.name.trim(),
    phone: normalizeIndianMobile(draft.phone),
    line1: draft.line1.trim(),
    line2: line2.length > 0 ? line2 : null,
    city: draft.city.trim(),
    state: draft.state.trim(),
    pincode: draft.pincode.trim(),
    isDefault: draft.isDefault,
  };
}

/**
 * True when the shopper has not entered delivery fields yet.
 * Name/phone may still be profile prefills — those alone are not progress.
 */
export function isAddressDraftPristine(draft: AddressDraft): boolean {
  return (
    !draft.line1.trim() &&
    !draft.line2.trim() &&
    !draft.city.trim() &&
    !draft.state.trim() &&
    !draft.pincode.trim()
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PIN_RE = /^[1-9][0-9]{5}$/;

export function validateContact(name: string, email: string): {
  name?: string;
  email?: string;
} {
  const errors: { name?: string; email?: string } = {};
  if (!name.trim()) errors.name = "Enter your name";
  if (!email.trim()) errors.email = "Enter your email";
  else if (!EMAIL_RE.test(email.trim())) errors.email = "Enter a valid email";
  return errors;
}

export function validateAddressDraft(draft: AddressDraft): AddressDraftErrors {
  const errors: AddressDraftErrors = {};
  if (!draft.name.trim()) errors.name = "Enter recipient name";

  const phone = normalizeIndianMobile(draft.phone);
  if (!phone || phone === "+91") {
    errors.phone = "Enter a mobile number";
  } else if (!isIndianMobileE164(phone)) {
    errors.phone = "Enter a valid Indian mobile (+91)";
  }

  if (!draft.line1.trim()) errors.line1 = "Enter house / street";
  if (!draft.city.trim()) errors.city = "Enter city";
  if (!draft.state.trim()) errors.state = "Enter state";
  if (!draft.pincode.trim()) errors.pincode = "Enter PIN code";
  else if (!PIN_RE.test(draft.pincode.trim())) {
    errors.pincode = "Enter a 6-digit PIN code";
  }
  return errors;
}
