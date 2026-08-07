import { BadRequestException } from '@nestjs/common';
import {
  isValidAdminProductStatusTransition,
  type ProductStatus,
} from '@ishraqparfums/shared';

/**
 * Nest wrapper around shared admin transition rules.
 * System park/cascade paths skip this and write ARCHIVED directly.
 */
export function assertValidProductStatusTransition(
  from: ProductStatus,
  to: ProductStatus,
): void {
  if (isValidAdminProductStatusTransition(from, to)) {
    return;
  }

  throw new BadRequestException(
    `Cannot change product status from ${from} to ${to}`,
  );
}
