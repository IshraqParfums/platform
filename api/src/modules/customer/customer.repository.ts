import { Injectable } from '@nestjs/common';
import type { AdminCustomerListSort } from '@ishraqparfums/shared';
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

  async findAdminMany(options?: {
    filters?: AdminCustomerFilters;
    sort?: AdminCustomerListSort;
    skip?: number;
    take?: number;
  }): Promise<Customer[]> {
    const sort = options?.sort ?? 'newest';
    const where = this.adminWhere(options?.filters);
    const skip = options?.skip;
    const take = options?.take;

    if (sort === 'orders-desc') {
      return this.findAdminManyByOrderCount({ where, skip, take });
    }

    const orderBy: Prisma.CustomerOrderByWithRelationInput =
      sort === 'name-asc'
        ? { name: { sort: 'asc', nulls: 'last' } }
        : { createdAt: 'desc' };

    return this.prisma.customer.findMany({
      where,
      orderBy,
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    });
  }

  private async findAdminManyByOrderCount(options: {
    where: Prisma.CustomerWhereInput;
    skip?: number;
    take?: number;
  }): Promise<Customer[]> {
    const matched = await this.prisma.customer.findMany({
      where: options.where,
      select: { id: true },
    });
    if (matched.length === 0) return [];

    const ids = matched.map((row) => row.id);
    const counts = await this.prisma.order.groupBy({
      by: ['customerId'],
      where: { customerId: { in: ids } },
      _count: true,
    });
    const countById = new Map(
      counts.map((row) => [row.customerId, row._count]),
    );

    const orderedIds = [...ids].sort((a, b) => {
      const diff = (countById.get(b) ?? 0) - (countById.get(a) ?? 0);
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });

    const pageIds =
      options.skip !== undefined || options.take !== undefined
        ? orderedIds.slice(
            options.skip ?? 0,
            options.take !== undefined
              ? (options.skip ?? 0) + options.take
              : undefined,
          )
        : orderedIds;

    if (pageIds.length === 0) return [];

    const customers = await this.prisma.customer.findMany({
      where: { id: { in: pageIds } },
    });
    const byId = new Map(customers.map((customer) => [customer.id, customer]));
    return pageIds
      .map((id) => byId.get(id))
      .filter((customer): customer is Customer => Boolean(customer));
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
