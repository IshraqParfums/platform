import { Injectable, NotFoundException } from '@nestjs/common';
import type { AddressResponse } from '@ishraqparfums/shared';
import type { CustomerAddress } from '@prisma/client';
import { AddressRepository } from './address.repository';
import { toAddressResponse } from './mappers/address.mapper';

@Injectable()
export class AddressService {
  constructor(private readonly addressRepository: AddressRepository) {}

  async list(customerId: string): Promise<AddressResponse[]> {
    const addresses = await this.addressRepository.findByCustomerId(customerId);
    return addresses.map(toAddressResponse);
  }

  async getOwnedOrThrow(
    customerId: string,
    addressId: string,
  ): Promise<CustomerAddress> {
    const address = await this.addressRepository.findById(addressId);

    if (!address || address.customerId !== customerId) {
      throw new NotFoundException(`Address with id "${addressId}" not found`);
    }

    return address;
  }

  async create(
    customerId: string,
    input: {
      name: string;
      phone: string;
      line1: string;
      line2?: string | null;
      city: string;
      state: string;
      pincode: string;
      isDefault?: boolean;
    },
  ): Promise<AddressResponse> {
    const count = await this.addressRepository.countByCustomer(customerId);
    const isDefault = input.isDefault === true || count === 0;

    if (isDefault) {
      await this.addressRepository.clearDefaults(customerId);
    }

    const address = await this.addressRepository.create({
      customerId,
      name: input.name.trim(),
      phone: input.phone.trim(),
      line1: input.line1.trim(),
      line2: input.line2?.trim() || null,
      city: input.city.trim(),
      state: input.state.trim(),
      pincode: input.pincode.trim(),
      isDefault,
    });

    return toAddressResponse(address);
  }

  async update(
    customerId: string,
    addressId: string,
    input: {
      name?: string;
      phone?: string;
      line1?: string;
      line2?: string | null;
      city?: string;
      state?: string;
      pincode?: string;
      isDefault?: boolean;
    },
  ): Promise<AddressResponse> {
    await this.getOwnedOrThrow(customerId, addressId);

    if (input.isDefault === true) {
      await this.addressRepository.clearDefaults(customerId);
    }

    const address = await this.addressRepository.update(addressId, {
      ...(input.name !== undefined ? { name: input.name.trim() } : {}),
      ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
      ...(input.line1 !== undefined ? { line1: input.line1.trim() } : {}),
      ...(input.line2 !== undefined
        ? { line2: input.line2?.trim() || null }
        : {}),
      ...(input.city !== undefined ? { city: input.city.trim() } : {}),
      ...(input.state !== undefined ? { state: input.state.trim() } : {}),
      ...(input.pincode !== undefined ? { pincode: input.pincode.trim() } : {}),
      ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    });

    return toAddressResponse(address);
  }

  async remove(customerId: string, addressId: string): Promise<void> {
    const address = await this.getOwnedOrThrow(customerId, addressId);
    await this.addressRepository.delete(addressId);

    if (address.isDefault) {
      const remaining =
        await this.addressRepository.findByCustomerId(customerId);
      const next = remaining[0];

      if (next) {
        await this.addressRepository.update(next.id, { isDefault: true });
      }
    }
  }
}
