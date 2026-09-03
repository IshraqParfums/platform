import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import type {
  WishlistIdsResponse,
  WishlistMergeResponse,
  WishlistResponse,
} from '@ishraqparfums/shared';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import type { RequestWithCustomer } from '../auth/types/request-with-customer';
import { WishlistService } from './wishlist.service';
import { AddWishlistItemDto, MergeWishlistDto } from './dto/wishlist.dto';

@Controller('wishlist')
@UseGuards(CustomerJwtGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  getWishlist(
    @Req() request: RequestWithCustomer,
  ): Promise<WishlistResponse> {
    return this.wishlistService.getWishlist(request.user.customerId);
  }

  @Get('ids')
  async getIds(
    @Req() request: RequestWithCustomer,
  ): Promise<WishlistIdsResponse> {
    const slugs = await this.wishlistService.getVisibleSlugs(
      request.user.customerId,
    );
    return { slugs };
  }

  @Post('items')
  addItem(
    @Req() request: RequestWithCustomer,
    @Body() body: AddWishlistItemDto,
  ): Promise<WishlistResponse> {
    return this.wishlistService.addItem(request.user.customerId, body.slug);
  }

  @Delete('items/:slug')
  removeItem(
    @Req() request: RequestWithCustomer,
    @Param('slug') slug: string,
  ): Promise<WishlistResponse> {
    return this.wishlistService.removeItem(request.user.customerId, slug);
  }

  @Post('merge')
  merge(
    @Req() request: RequestWithCustomer,
    @Body() body: MergeWishlistDto,
  ): Promise<WishlistMergeResponse> {
    return this.wishlistService.merge(request.user.customerId, body.slugs);
  }
}
