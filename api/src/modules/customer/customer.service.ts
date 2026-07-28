import {
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

  async updateCheckoutProfile(
    customerId: string,
    name: string,
    email: string,
  ): Promise<Customer> {
    const existing = await this.customerRepository.findByEmail(email);

    if (existing && existing.id !== customerId) {
      throw new ConflictException(
        'This email is already associated with another account.',
      );
    }

    return this.customerRepository.updateProfile(customerId, { name, email });
  }
}
