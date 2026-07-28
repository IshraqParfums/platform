import { Injectable } from '@nestjs/common';
import type { Prisma, Review } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type {
  ReviewWithCustomer,
  ReviewWithProduct,
} from './mappers/review.mapper';

export type RatingSummaryRow = {
  productId: string;
  _avg: { rating: number | null };
  _count: { rating: number };
};

@Injectable()
export class ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<ReviewWithCustomer | null> {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  findByCustomerAndProduct(
    customerId: string,
    productId: string,
  ): Promise<Review | null> {
    return this.prisma.review.findUnique({
      where: {
        customerId_productId: { customerId, productId },
      },
    });
  }

  findByProductId(
    productId: string,
    options: { skip: number; take: number },
  ): Promise<ReviewWithCustomer[]> {
    return this.prisma.review.findMany({
      where: { productId },
      include: {
        customer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  countByProductId(productId: string): Promise<number> {
    return this.prisma.review.count({
      where: { productId },
    });
  }

  findByCustomerId(
    customerId: string,
    options: { skip: number; take: number },
  ): Promise<(ReviewWithProduct & ReviewWithCustomer)[]> {
    return this.prisma.review.findMany({
      where: { customerId },
      include: {
        customer: { select: { id: true, name: true } },
        product: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: options.skip,
      take: options.take,
    });
  }

  countByCustomerId(customerId: string): Promise<number> {
    return this.prisma.review.count({
      where: { customerId },
    });
  }

  create(data: {
    customerId: string;
    productId: string;
    rating: number;
    title?: string;
    body?: string;
  }): Promise<ReviewWithCustomer> {
    return this.prisma.review.create({
      data: {
        customerId: data.customerId,
        productId: data.productId,
        rating: data.rating,
        title: data.title,
        body: data.body,
      },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  update(
    id: string,
    data: Prisma.ReviewUpdateInput,
  ): Promise<ReviewWithCustomer> {
    return this.prisma.review.update({
      where: { id },
      data,
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  aggregateByProductIds(productIds: string[]) {
    if (productIds.length === 0) {
      return Promise.resolve([] as RatingSummaryRow[]);
    }

    return this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds } },
      _avg: { rating: true },
      _count: { rating: true },
    });
  }

  breakdownByProductId(productId: string) {
    return this.prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { _all: true },
    });
  }
}
