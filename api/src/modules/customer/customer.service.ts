import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CustomerSummary } from '@ishraqparfums/shared';
import type { Customer } from '@prisma/client';
import { CustomerRepository } from './customer.repository';
import { toCustomerSummary } from './mappers/customer.mapper';

@Injectable()
export class CustomerService {
  constructor(private readonly customerRepository: CustomerRepository) {}

  upsertByPhone(phone: string): Promise<Customer> {
    return this.customerRepository.upsertByPhone(phone);
  }

  async getByIdOrThrow(id: string): Promise<CustomerSummary> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    return toCustomerSummary(customer);
  }

  toSummary(customer: Customer): CustomerSummary {
    return toCustomerSummary(customer);
  }

  async updateProfile(
    customerId: string,
    input: { name?: string; email?: string },
  ): Promise<Customer> {
    const name =
      input.name !== undefined ? input.name.trim() : undefined;
    const email =
      input.email !== undefined ? input.email.trim().toLowerCase() : undefined;

    if (name === undefined && email === undefined) {
      throw new BadRequestException('At least one of name or email is required.');
    }

    if (name !== undefined && name.length < 1) {
      throw new BadRequestException('Name must not be empty.');
    }

    if (email !== undefined) {
      const existing = await this.customerRepository.findByEmail(email);

      if (existing && existing.id !== customerId) {
        throw new ConflictException(
          'This email is already associated with another account.',
        );
      }
    }

    return this.customerRepository.updateProfile(customerId, {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
    });
  }
}
