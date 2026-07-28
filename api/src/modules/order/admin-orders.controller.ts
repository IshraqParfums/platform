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
  AdminOrderDetail,
  AdminOrderSummary,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { AdminListOrdersQueryDto } from './dto/admin-list-orders.query.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';

@Controller('admin/orders')
@UseGuards(AdminJwtGuard)
export class AdminOrdersController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  list(
    @Query() query: AdminListOrdersQueryDto,
  ): Promise<PaginatedResponse<AdminOrderSummary>> {
    return this.orderService.listAdmin(query);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string): Promise<AdminOrderDetail> {
    return this.orderService.getAdminById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateOrderStatusDto,
  ): Promise<AdminOrderDetail> {
    return this.orderService.updateStatusAsAdmin(id, body.status);
  }
}
