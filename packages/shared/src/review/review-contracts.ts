export interface ReviewResponse {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  reviewerName: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReviewBody {
  rating: number;
  title?: string;
  body?: string;
}

export interface UpdateReviewBody {
  rating?: number;
  title?: string | null;
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
  items: ReviewResponse[];
  total: number;
  page: number;
  pageSize: number;
  ratingAverage: number | null;
  ratingCount: number;
  ratingBreakdown: RatingBreakdown;
}

export interface MyReviewResponse extends ReviewResponse {
  productName: string;
  productSlug: string;
}
