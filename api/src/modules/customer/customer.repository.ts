import { Injectable } from '@nestjs/common';
import type { Customer } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
    data: { name: string; email: string },
  ): Promise<Customer> {
    return this.prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
      },
    });
  }
}
