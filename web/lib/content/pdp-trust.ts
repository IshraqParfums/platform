import { SHIPPING_PAISE } from "@/lib/cart/shipping";
import { formatPaise } from "@/lib/format/money";

/** Store-wide checkout facts under Add to cart — not per-product claims. */
export const PDP_TRUST = [
  "Pan-India delivery",
  `Flat ${formatPaise(SHIPPING_PAISE)} shipping`,
  "Secure Razorpay checkout",
] as const;
