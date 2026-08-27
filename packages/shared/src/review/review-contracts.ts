export interface ReviewResponse {
  id: string;
  rating: number;
  body: string | null;
  reviewerName: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewBody {
  rating: number;
  body?: string;
}

export interface UpdateReviewBody {
  rating?: number;
  body?: string | null;
}

export interface RatingBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface ProductReviewsResponse {
  /** Community reviews for this page (excludes the viewer when authenticated). */
  items: ReviewResponse[];
  /** Community review count used for pagination (excludes the viewer when authenticated). */
  total: number;
  page: number;
  pageSize: number;
  /** Product-level aggregates — always include every review, including the viewer’s. */
  ratingAverage: number | null;
  ratingCount: number;
  ratingBreakdown: RatingBreakdown;
}

export interface MyReviewResponse extends ReviewResponse {
  productName: string;
  productSlug: string;
}
