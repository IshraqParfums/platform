import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { CustomerSummary } from '@ishraqparfums/shared';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import type { RequestWithCustomer } from '../auth/types/request-with-customer';
import { CustomerService } from './customer.service';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { toCustomerSummary } from './mappers/customer.mapper';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customerService: CustomerService) {}

  @Get('me')
  @UseGuards(CustomerJwtGuard)
  me(@Req() request: RequestWithCustomer): Promise<CustomerSummary> {
    return this.customerService.getByIdOrThrow(request.user.customerId);
  }

  @Patch('me')
  @UseGuards(CustomerJwtGuard)
  async updateMe(
    @Req() request: RequestWithCustomer,
    @Body() body: UpdateCustomerProfileDto,
  ): Promise<CustomerSummary> {
    const customer = await this.customerService.updateProfile(
      request.user.customerId,
      body,
    );
    return toCustomerSummary(customer);
  }
}
