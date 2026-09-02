export const CHECKOUT_RAZORPAY_WINDOW_SECONDS = 600;

/** Derived, not independently set, so it can never violate the >= razorpay window invariant. */
export const CHECKOUT_RESERVATION_TTL_SECONDS =
  CHECKOUT_RAZORPAY_WINDOW_SECONDS + 60;

/** Cap on rows read per `findExpiredPending` page. */
export const ORDER_EXPIRY_SWEEP_BATCH_SIZE = 50;

/** Hard ceiling on pages drained in one sweep tick — see reconcileExpiredPendingOrders. */
export const ORDER_EXPIRY_SWEEP_MAX_PAGES = 20;
