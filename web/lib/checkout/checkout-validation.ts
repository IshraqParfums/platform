import type { CreateAddressBody } from "@ishraqparfums/shared";

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
    phone: draft.phone.trim(),
    line1: draft.line1.trim(),
    line2: line2.length > 0 ? line2 : null,
    city: draft.city.trim(),
    state: draft.state.trim(),
    pincode: draft.pincode.trim(),
    isDefault: draft.isDefault,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** E.164-ish: + and 8–15 digits total after optional spaces. */
const PHONE_RE = /^\+[1-9]\d{7,14}$/;
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
  const phone = draft.phone.replace(/[\s-]/g, "");
  if (!phone || phone === "+91") errors.phone = "Enter a mobile number";
  else if (!PHONE_RE.test(phone)) {
    errors.phone = "Use country code, e.g. +91…";
  }
  if (!draft.line1.trim()) errors.line1 = "Enter street address";
  if (!draft.city.trim()) errors.city = "Enter city";
  if (!draft.state.trim()) errors.state = "Enter state";
  if (!draft.pincode.trim()) errors.pincode = "Enter PIN code";
  else if (!PIN_RE.test(draft.pincode.trim())) {
    errors.pincode = "Enter a 6-digit PIN code";
  }
  return errors;
}

export function normalizePhoneInput(value: string): string {
  const cleaned = value.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    return `+${cleaned.replace(/\+/g, "")}`;
  }
  return `+${cleaned.slice(1).replace(/\+/g, "")}`;
}
