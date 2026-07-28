import { Injectable } from '@nestjs/common';
import type { CustomerAddress } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByCustomerId(customerId: string): Promise<CustomerAddress[]> {
    return this.prisma.customerAddress.findMany({
      where: { customerId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  findById(id: string): Promise<CustomerAddress | null> {
    return this.prisma.customerAddress.findUnique({ where: { id } });
  }

  create(data: {
    customerId: string;
    name: string;
    phone: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
  }): Promise<CustomerAddress> {
    return this.prisma.customerAddress.create({ data });
  }

  update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      line1?: string;
      line2?: string | null;
      city?: string;
      state?: string;
      pincode?: string;
      isDefault?: boolean;
    },
  ): Promise<CustomerAddress> {
    return this.prisma.customerAddress.update({
      where: { id },
      data,
    });
  }

  async clearDefaults(customerId: string): Promise<void> {
    await this.prisma.customerAddress.updateMany({
      where: { customerId, isDefault: true },
      data: { isDefault: false },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.customerAddress.delete({ where: { id } });
  }

  countByCustomer(customerId: string): Promise<number> {
    return this.prisma.customerAddress.count({ where: { customerId } });
  }
}
