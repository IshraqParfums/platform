import type { OrderStatus } from '../order/order-contracts.js';

export type AnalyticsRange = '7d' | '30d' | '90d' | 'all';

export interface AdminAnalyticsOverview {
  range: AnalyticsRange;
  revenuePaise: number;
  orderCount: number;
  averageOrderValuePaise: number;
  needsReviewCount: number;
  lowStockCount: number;
  newCustomerCount: number;
  returningCustomerCount: number;
}

export interface AdminRevenuePoint {
  date: string;
  revenuePaise: number;
  orderCount: number;
}

export interface AdminRevenueSeriesResponse {
  range: AnalyticsRange;
  points: AdminRevenuePoint[];
}

export interface AdminOrderStatusBreakdownItem {
  status: OrderStatus;
  count: number;
}

export interface AdminOrderStatusBreakdownResponse {
  items: AdminOrderStatusBreakdownItem[];
}

export interface AdminTopProduct {
  productId: string;
  productName: string;
  productSlug: string;
  variantId: string | null;
  sizeMl: number | null;
  quantitySold: number;
  revenuePaise: number;
}

export interface AdminTopProductsResponse {
  range: AnalyticsRange;
  items: AdminTopProduct[];
}
