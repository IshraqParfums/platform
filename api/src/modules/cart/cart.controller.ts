import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { CartMergeResponse, CartResponse } from '@ishraqparfums/shared';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import type { RequestWithCustomer } from '../auth/types/request-with-customer';
import { CartService } from './cart.service';
import {
  AddBespokeCartItemDto,
  AddCartItemDto,
  MergeCartDto,
  UpdateCartItemDto,
} from './dto/cart.dto';

@Controller('cart')
@UseGuards(CustomerJwtGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() request: RequestWithCustomer): Promise<CartResponse> {
    return this.cartService.getCart(request.user.customerId);
  }

  @Post('items')
  addItem(
    @Req() request: RequestWithCustomer,
    @Body() body: AddCartItemDto,
  ): Promise<CartResponse> {
    return this.cartService.addItem(
      request.user.customerId,
      body.variantId,
      body.quantity,
    );
  }

  @Post('items/bespoke')
  addBespokeItem(
    @Req() request: RequestWithCustomer,
    @Body() body: AddBespokeCartItemDto,
  ): Promise<CartResponse> {
    return this.cartService.addBespokeItem(
      request.user.customerId,
      body.bespokePerfumeId,
      body.sizeMl,
      body.quantity,
    );
  }

  @Patch('items/:itemId')
  updateItem(
    @Req() request: RequestWithCustomer,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() body: UpdateCartItemDto,
  ): Promise<CartResponse> {
    return this.cartService.updateItem(
      request.user.customerId,
      itemId,
      body.quantity,
    );
  }

  @Delete('items/:itemId')
  removeItem(
    @Req() request: RequestWithCustomer,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<CartResponse> {
    return this.cartService.removeItem(request.user.customerId, itemId);
  }

  @Post('merge')
  merge(
    @Req() request: RequestWithCustomer,
    @Body() body: MergeCartDto,
  ): Promise<CartMergeResponse> {
    return this.cartService.merge(request.user.customerId, body.items);
  }
}
