/** Sane ceiling on saved addresses per customer — keeps `findByCustomerId` a
 *  small, unpaginated list by construction; no pagination machinery needed. */
export const MAX_ADDRESSES_PER_CUSTOMER = 20;
