import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminCustomerSummary,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { AdminListCustomersQueryDto } from './dto/admin-list-customers.query.dto';
import { AdminUpdateCustomerDto } from './dto/admin-update-customer.dto';
import { CustomerService } from './customer.service';

@Controller('admin/customers')
@UseGuards(AdminJwtGuard)
export class AdminCustomersController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  list(
    @Query() query: AdminListCustomersQueryDto,
  ): Promise<PaginatedResponse<AdminCustomerSummary>> {
    return this.customerService.listAdmin(query);
  }

  @Get(':id')
  getById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AdminCustomerSummary> {
    return this.customerService.getAdminById(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminUpdateCustomerDto,
  ): Promise<AdminCustomerSummary> {
    return this.customerService.updateAsAdmin(id, body);
  }
}
