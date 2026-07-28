import type {
  MyReviewResponse,
  ReviewResponse,
} from '@ishraqparfums/shared';
import type { Customer, Product, Review } from '@prisma/client';

export const REVIEWER_NAME_FALLBACK = 'Ishraq Customer';

export type ReviewWithCustomer = Review & {
  customer: Pick<Customer, 'id' | 'name'>;
};

export type ReviewWithProduct = Review & {
  product: Pick<Product, 'name' | 'slug'>;
};

export function toReviewerName(name: string | null | undefined): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : REVIEWER_NAME_FALLBACK;
}

export function toReviewResponse(
  review: ReviewWithCustomer,
  isVerifiedBuyer: boolean,
): ReviewResponse {
  return {
    id: review.id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    reviewerName: toReviewerName(review.customer.name),
    isVerifiedBuyer,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}

export function toMyReviewResponse(
  review: ReviewWithProduct & { customer: Pick<Customer, 'id' | 'name'> },
  isVerifiedBuyer: boolean,
): MyReviewResponse {
  return {
    ...toReviewResponse(review, isVerifiedBuyer),
    productName: review.product.name,
    productSlug: review.product.slug,
  };
}
