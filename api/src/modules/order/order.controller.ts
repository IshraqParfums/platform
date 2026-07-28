import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  CheckoutResponse,
  OrderDetail,
  OrderSummary,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import { PaginationQueryDto } from '../../common/dto/pagination.query.dto';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import type { RequestWithCustomer } from '../auth/types/request-with-customer';
import { CheckoutDto } from './dto/checkout.dto';
import { OrderService } from './order.service';

@Controller()
@UseGuards(CustomerJwtGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  checkout(
    @Req() request: RequestWithCustomer,
    @Body() body: CheckoutDto,
  ): Promise<CheckoutResponse> {
    return this.orderService.checkout(request.user.customerId, body);
  }

  @Get('orders')
  list(
    @Req() request: RequestWithCustomer,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<OrderSummary>> {
    return this.orderService.listForCustomer(
      request.user.customerId,
      query.page,
      query.pageSize,
    );
  }

  @Get('orders/:id')
  getOne(
    @Req() request: RequestWithCustomer,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderDetail> {
    return this.orderService.getForCustomer(request.user.customerId, id);
  }
}
