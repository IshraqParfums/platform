import type { PaginatedResponse } from "../pagination/pagination-contracts.js";
import type { CustomerOrderStatusCounts } from "./customer-order-filters.js";
import type { OrderSummary } from "./order-contracts.js";

export interface CustomerOrderListResponse
  extends PaginatedResponse<OrderSummary> {
  counts: CustomerOrderStatusCounts;
}
