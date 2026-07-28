export const SHIPPING_PAISE = 5000;

export const CHECKOUT_RAZORPAY_WINDOW_SECONDS = 600;

/** Derived, not independently set, so it can never violate the >= razorpay window invariant. */
export const CHECKOUT_RESERVATION_TTL_SECONDS =
  CHECKOUT_RAZORPAY_WINDOW_SECONDS + 60;
