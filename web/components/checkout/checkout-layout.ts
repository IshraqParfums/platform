/**
 * Shared checkout rhythm — tighten within sections, keep calm between them.
 * Consume these class tokens instead of hardcoding spacing in each module.
 */
export const checkoutLayout = {
  pageGrid:
    "grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(17rem,21rem)] lg:items-start lg:gap-10 xl:gap-14",
  formStack: "space-y-8",
  sectionToFields: "mt-4",
  fieldGrid: "gap-3",
  fieldStack: "space-y-3",
  labelToControl: "mt-1.5",
  addressList: "mt-4 space-y-2.5",
  addressCard: "px-4 py-3",
} as const;
