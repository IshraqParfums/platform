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
