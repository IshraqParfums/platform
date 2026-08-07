import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminCustomerSummary,
  CustomerSummary,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import type { Customer } from '@prisma/client';
import { toPaginatedResponse, toSkipTake } from '../../common/pagination';
import { CustomerRepository } from './customer.repository';
import type { AdminListCustomersQueryDto } from './dto/admin-list-customers.query.dto';
import type { AdminUpdateCustomerDto } from './dto/admin-update-customer.dto';
import {
  toAdminCustomerSummary,
  toCustomerSummary,
} from './mappers/customer.mapper';

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
    const name = input.name !== undefined ? input.name.trim() : undefined;
    const email =
      input.email !== undefined ? input.email.trim().toLowerCase() : undefined;

    if (name === undefined && email === undefined) {
      throw new BadRequestException(
        'At least one of name or email is required.',
      );
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

  // --- Admin ---

  async listAdmin(
    query: AdminListCustomersQueryDto,
  ): Promise<PaginatedResponse<AdminCustomerSummary>> {
    const { skip, take, page, pageSize } = toSkipTake(
      query.page,
      query.pageSize,
    );
    const filters = { search: query.search };

    const [customers, total] = await Promise.all([
      this.customerRepository.findAdminMany({
        filters,
        sort: query.sort,
        skip,
        take,
      }),
      this.customerRepository.countAdmin(filters),
    ]);

    const orderCounts = await this.customerRepository.countOrdersByCustomerIds(
      customers.map((customer) => customer.id),
    );

    const items = customers.map((customer) =>
      toAdminCustomerSummary(customer, orderCounts.get(customer.id) ?? 0),
    );

    return toPaginatedResponse(items, total, page, pageSize);
  }

  async getAdminById(id: string): Promise<AdminCustomerSummary> {
    const customer = await this.customerRepository.findById(id);

    if (!customer) {
      throw new NotFoundException('Customer not found.');
    }

    const orderCount =
      await this.customerRepository.countOrdersByCustomerId(id);

    return toAdminCustomerSummary(customer, orderCount);
  }

  async updateAsAdmin(
    id: string,
    input: AdminUpdateCustomerDto,
  ): Promise<AdminCustomerSummary> {
    await this.getAdminById(id);
    const customer = await this.updateProfile(id, input);
    const orderCount =
      await this.customerRepository.countOrdersByCustomerId(id);

    return toAdminCustomerSummary(customer, orderCount);
  }
}
