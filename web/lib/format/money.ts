const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Formats an integer paise amount as Indian rupees, e.g. 159900 -> "₹1,599". */
export function formatPaise(paise: number): string {
  return INR.format(paise / 100);
}

/** Percentage saved when a compare-at price is present and higher. */
export function discountPercent(
  pricePaise: number,
  compareAtPaise: number | null,
): number | null {
  if (!compareAtPaise || compareAtPaise <= pricePaise) {
    return null;
  }
  return Math.round(((compareAtPaise - pricePaise) / compareAtPaise) * 100);
}
