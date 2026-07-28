import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import type {
  MyReviewResponse,
  PaginatedResponse,
  ProductReviewsResponse,
  RatingBreakdown,
  ReviewResponse,
} from '@ishraqparfums/shared';
import { Prisma } from '@prisma/client';
import { toPaginatedResponse, toSkipTake } from '../../common/pagination';
import { OrderService } from '../order/order.service';
import { ProductService } from '../product/product.service';
import type { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import {
  toMyReviewResponse,
  toReviewResponse,
} from './mappers/review.mapper';
import {
  buildRatingSummaryMap,
  type ProductRatingSummary,
} from './rating-summary';
import { ReviewRepository } from './review.repository';

export type { ProductRatingSummary };

@Injectable()
export class ReviewService {
  constructor(
    private readonly reviewRepository: ReviewRepository,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
  ) {}

  async getRatingSummaries(
    productIds: string[],
  ): Promise<Map<string, ProductRatingSummary>> {
    const rows = await this.reviewRepository.aggregateByProductIds(productIds);
    return buildRatingSummaryMap(productIds, rows);
  }

  async listForProduct(
    slug: string,
    page?: number,
    pageSize?: number,
  ): Promise<ProductReviewsResponse> {
    const product = await this.productService.requireActiveBySlug(slug);
    const { skip, take, page: safePage, pageSize: safePageSize } = toSkipTake(
      page,
      pageSize,
    );

    const [reviews, total, summaryMap, breakdownRows] = await Promise.all([
      this.reviewRepository.findByProductId(product.id, { skip, take }),
      this.reviewRepository.countByProductId(product.id),
      this.getRatingSummaries([product.id]),
      this.reviewRepository.breakdownByProductId(product.id),
    ]);

    const purchaserIds = await this.orderService.findPurchasersOfProduct(
      product.id,
      reviews.map((review) => review.customerId),
    );

    const summary = summaryMap.get(product.id) ?? {
      ratingAverage: null,
      reviewCount: 0,
    };

    return {
      items: reviews.map((review) =>
        toReviewResponse(review, purchaserIds.has(review.customerId)),
      ),
      total,
      page: safePage,
      pageSize: safePageSize,
      ratingAverage: summary.ratingAverage,
      ratingCount: summary.reviewCount,
      ratingBreakdown: this.toBreakdown(breakdownRows),
    };
  }

  async create(
    customerId: string,
    slug: string,
    input: CreateReviewDto,
  ): Promise<ReviewResponse> {
    const product = await this.productService.requireActiveBySlug(slug);
    const existing = await this.reviewRepository.findByCustomerAndProduct(
      customerId,
      product.id,
    );

    if (existing) {
      throw new ConflictException(
        'You have already reviewed this product. Edit your existing review instead.',
      );
    }

    try {
      const review = await this.reviewRepository.create({
        customerId,
        productId: product.id,
        rating: input.rating,
        title: input.title?.trim(),
        body: input.body?.trim(),
      });

      const purchasers = await this.orderService.findPurchasersOfProduct(
        product.id,
        [customerId],
      );

      return toReviewResponse(review, purchasers.has(customerId));
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'You have already reviewed this product. Edit your existing review instead.',
        );
      }

      throw error;
    }
  }

  async update(
    customerId: string,
    reviewId: string,
    input: UpdateReviewDto,
  ): Promise<ReviewResponse> {
    const review = await this.reviewRepository.findById(reviewId);

    if (!review || review.customerId !== customerId) {
      throw new NotFoundException(`Review with id "${reviewId}" not found`);
    }

    const updated = await this.reviewRepository.update(reviewId, {
      ...(input.rating !== undefined ? { rating: input.rating } : {}),
      ...(input.title !== undefined
        ? { title: input.title === null ? null : input.title.trim() }
        : {}),
      ...(input.body !== undefined
        ? { body: input.body === null ? null : input.body.trim() }
        : {}),
    });

    const purchasers = await this.orderService.findPurchasersOfProduct(
      review.productId,
      [customerId],
    );

    return toReviewResponse(updated, purchasers.has(customerId));
  }

  async listMine(
    customerId: string,
    page?: number,
    pageSize?: number,
  ): Promise<PaginatedResponse<MyReviewResponse>> {
    const { skip, take, page: safePage, pageSize: safePageSize } = toSkipTake(
      page,
      pageSize,
    );

    const [reviews, total] = await Promise.all([
      this.reviewRepository.findByCustomerId(customerId, { skip, take }),
      this.reviewRepository.countByCustomerId(customerId),
    ]);

    const productIds = [...new Set(reviews.map((review) => review.productId))];
    const verifiedByProduct = new Map<string, boolean>();

    await Promise.all(
      productIds.map(async (productId) => {
        const purchasers = await this.orderService.findPurchasersOfProduct(
          productId,
          [customerId],
        );
        verifiedByProduct.set(productId, purchasers.has(customerId));
      }),
    );

    const items = reviews.map((review) =>
      toMyReviewResponse(
        review,
        verifiedByProduct.get(review.productId) ?? false,
      ),
    );

    return toPaginatedResponse(items, total, safePage, safePageSize);
  }

  private toBreakdown(
    rows: { rating: number; _count: { _all: number } }[],
  ): RatingBreakdown {
    const breakdown: RatingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const row of rows) {
      if (row.rating >= 1 && row.rating <= 5) {
        breakdown[row.rating as 1 | 2 | 3 | 4 | 5] = row._count._all;
      }
    }

    return breakdown;
  }
}
