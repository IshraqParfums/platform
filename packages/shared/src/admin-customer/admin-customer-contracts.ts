export interface AdminCustomerSummary {
  id: string;
  phone: string;
  email: string | null;
  name: string | null;
  orderCount: number;
  createdAt: string;
}

export interface AdminUpdateCustomerBody {
  name?: string;
  email?: string;
}

export const ADMIN_CUSTOMER_LIST_SORTS = [
  "newest",
  "orders-desc",
  "name-asc",
] as const;

export type AdminCustomerListSort = (typeof ADMIN_CUSTOMER_LIST_SORTS)[number];

export const ADMIN_CUSTOMER_LIST_SORT_DEFAULT: AdminCustomerListSort = "newest";

export function isAdminCustomerListSort(
  value: unknown,
): value is AdminCustomerListSort {
  return (
    typeof value === "string" &&
    (ADMIN_CUSTOMER_LIST_SORTS as readonly string[]).includes(value)
  );
}
