import type { CustomerSummary } from '@ishraqparfums/shared';
import type { Customer } from '@prisma/client';

export function toCustomerSummary(customer: Customer): CustomerSummary {
  return {
    id: customer.id,
    phone: customer.phone,
    email: customer.email,
    name: customer.name,
  };
}
