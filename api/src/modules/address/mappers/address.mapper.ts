import type { AddressResponse } from '@ishraqparfums/shared';
import type { CustomerAddress } from '@prisma/client';

export function toAddressResponse(address: CustomerAddress): AddressResponse {
  return {
    id: address.id,
    name: address.name,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    isDefault: address.isDefault,
  };
}
