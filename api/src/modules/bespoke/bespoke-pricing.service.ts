import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BESPOKE_ALLOWED_SIZES_ML,
  BESPOKE_MAX_LINE_QUANTITY,
  BESPOKE_PAISE_PER_ML,
} from '@ishraqparfums/shared';

@Injectable()
export class BespokePricingService {
  paisePerMl(): number {
    return BESPOKE_PAISE_PER_ML;
  }

  allowedSizesMl(): number[] {
    return [...BESPOKE_ALLOWED_SIZES_ML];
  }

  assertAllowedSize(sizeMl: number): void {
    if (!Number.isInteger(sizeMl) || !this.allowedSizesMl().includes(sizeMl)) {
      throw new BadRequestException(
        `Invalid bespoke size ${sizeMl}ml. Allowed: ${this.allowedSizesMl().join(', ')}`,
      );
    }
  }

  assertLineQuantity(quantity: number): void {
    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > BESPOKE_MAX_LINE_QUANTITY
    ) {
      throw new BadRequestException(
        `Bespoke quantity must be between 1 and ${BESPOKE_MAX_LINE_QUANTITY}`,
      );
    }
  }

  unitPricePaise(sizeMl: number): number {
    this.assertAllowedSize(sizeMl);
    return sizeMl * this.paisePerMl();
  }
}
