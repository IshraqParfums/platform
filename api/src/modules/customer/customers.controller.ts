import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { CustomerSummary } from '@ishraqparfums/shared';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import type { RequestWithCustomer } from '../auth/types/request-with-customer';
import { CustomerService } from './customer.service';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('me')
  @UseGuards(CustomerJwtGuard)
  me(@Req() request: RequestWithCustomer): Promise<CustomerSummary> {
    return this.customerService.getByIdOrThrow(request.user.customerId);
  }
}
