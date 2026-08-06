import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  MyReviewResponse,
  PaginatedResponse,
  ProductReviewsResponse,
  ReviewResponse,
} from '@ishraqparfums/shared';
import { PaginationQueryDto } from '../../common/dto/pagination.query.dto';
import { CustomerJwtGuard } from '../auth/guards/customer-jwt.guard';
import { OptionalCustomerJwtGuard } from '../auth/guards/optional-customer-jwt.guard';
import type {
  RequestWithCustomer,
  RequestWithOptionalCustomer,
} from '../auth/types/request-with-customer';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewService } from './review.service';

@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * Community list. Optional JWT excludes the viewer’s own review from
   * `items`/`total` so pagination stays aligned with the sticky “yours” column.
   */
  @Get('products/:slug/reviews')
  @UseGuards(OptionalCustomerJwtGuard)
  listForProduct(
    @Req() request: RequestWithOptionalCustomer,
    @Param('slug') slug: string,
    @Query() query: PaginationQueryDto,
  ): Promise<ProductReviewsResponse> {
    return this.reviewService.listForProduct(
      slug,
      query.page,
      query.pageSize,
      request.user?.customerId,
    );
  }

  /** Current customer's review for this product — 404 when none. */
  @Get('products/:slug/reviews/me')
  @UseGuards(CustomerJwtGuard)
  getMineForProduct(
    @Req() request: RequestWithCustomer,
    @Param('slug') slug: string,
  ): Promise<ReviewResponse> {
    return this.reviewService.getMineForProduct(
      request.user.customerId,
      slug,
    );
  }

  @Post('products/:slug/reviews')
  @UseGuards(CustomerJwtGuard)
  create(
    @Req() request: RequestWithCustomer,
    @Param('slug') slug: string,
    @Body() body: CreateReviewDto,
  ): Promise<ReviewResponse> {
    return this.reviewService.create(request.user.customerId, slug, body);
  }

  @Get('reviews/me')
  @UseGuards(CustomerJwtGuard)
  listMine(
    @Req() request: RequestWithCustomer,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<MyReviewResponse>> {
    return this.reviewService.listMine(
      request.user.customerId,
      query.page,
      query.pageSize,
    );
  }

  @Patch('reviews/:id')
  @UseGuards(CustomerJwtGuard)
  update(
    @Req() request: RequestWithCustomer,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateReviewDto,
  ): Promise<ReviewResponse> {
    return this.reviewService.update(request.user.customerId, id, body);
  }

  @Delete('reviews/:id')
  @HttpCode(204)
  @UseGuards(CustomerJwtGuard)
  remove(
    @Req() request: RequestWithCustomer,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.reviewService.remove(request.user.customerId, id);
  }
}
