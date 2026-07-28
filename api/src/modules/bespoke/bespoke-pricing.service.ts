import { BadRequestException, Injectable } from '@nestjs/common';
import {
  BESPOKE_ALLOWED_SIZES_ML,
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

  unitPricePaise(sizeMl: number): number {
    this.assertAllowedSize(sizeMl);
    return sizeMl * this.paisePerMl();
  }
}
