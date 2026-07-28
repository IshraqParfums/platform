import { Injectable } from '@nestjs/common';
import type { Customer, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface AdminCustomerFilters {
  search?: string;
}

@Injectable()
export class CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { id } });
  }

  findByPhone(phone: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { phone } });
  }

  upsertByPhone(phone: string): Promise<Customer> {
    return this.prisma.customer.upsert({
      where: { phone },
      create: { phone },
      update: {},
    });
  }

  findByEmail(email: string): Promise<Customer | null> {
    return this.prisma.customer.findUnique({ where: { email } });
  }

  updateProfile(
    id: string,
    data: { name?: string; email?: string },
  ): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email } : {}),
      },
    });
  }

  private adminWhere(
    filters?: AdminCustomerFilters,
  ): Prisma.CustomerWhereInput {
    if (!filters?.search) {
      return {};
    }

    const search = filters.search;
    return {
      OR: [
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' as const } },
        { name: { contains: search, mode: 'insensitive' as const } },
      ],
    };
  }

  findAdminMany(options?: {
    filters?: AdminCustomerFilters;
    skip?: number;
    take?: number;
  }): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      where: this.adminWhere(options?.filters),
      orderBy: { createdAt: 'desc' },
      ...(options?.skip !== undefined ? { skip: options.skip } : {}),
      ...(options?.take !== undefined ? { take: options.take } : {}),
    });
  }

  countAdmin(filters?: AdminCustomerFilters): Promise<number> {
    return this.prisma.customer.count({ where: this.adminWhere(filters) });
  }

  countOrdersByCustomerId(customerId: string): Promise<number> {
    return this.prisma.order.count({ where: { customerId } });
  }

  async countOrdersByCustomerIds(
    customerIds: string[],
  ): Promise<Map<string, number>> {
    if (customerIds.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { customerId: { in: customerIds } },
      _count: true,
    });

    return new Map(rows.map((row) => [row.customerId, row._count]));
  }
}
