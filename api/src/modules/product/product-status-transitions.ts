import { BadRequestException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<ProductStatus, ProductStatus[]> = {
  [ProductStatus.DRAFT]: [ProductStatus.ACTIVE, ProductStatus.DELETED],
  [ProductStatus.ACTIVE]: [
    ProductStatus.DRAFT,
    ProductStatus.ARCHIVED,
    ProductStatus.DELETED,
  ],
  [ProductStatus.ARCHIVED]: [ProductStatus.ACTIVE, ProductStatus.DELETED],
  [ProductStatus.DELETED]: [],
};

export function assertValidProductStatusTransition(
  from: ProductStatus,
  to: ProductStatus,
): void {
  if (from === to) {
    return;
  }

  if (!ALLOWED_TRANSITIONS[from].includes(to)) {
    throw new BadRequestException(
      `Cannot change product status from ${from} to ${to}`,
    );
  }
}
