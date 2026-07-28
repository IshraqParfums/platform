import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BESPOKE_ALLOWED_SIZES_ML,
  BESPOKE_PAISE_PER_ML,
} from '@ishraqparfums/shared';

@Injectable()
export class BespokePricingService {
  constructor(private readonly configService: ConfigService) {}

  paisePerMl(): number {
    const raw = this.configService.get<string>('BESPOKE_PAISE_PER_ML');
    if (raw === undefined || raw === '') {
      return BESPOKE_PAISE_PER_ML;
    }
    const value = Number.parseInt(raw, 10);
    return Number.isFinite(value) && value > 0 ? value : BESPOKE_PAISE_PER_ML;
  }

  allowedSizesMl(): number[] {
    const raw = this.configService.get<string>('BESPOKE_ALLOWED_SIZES_ML');
    if (!raw || raw.trim() === '') {
      return [...BESPOKE_ALLOWED_SIZES_ML];
    }
    const sizes = raw
      .split(',')
      .map((part) => Number.parseInt(part.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0);
    return sizes.length > 0 ? sizes : [...BESPOKE_ALLOWED_SIZES_ML];
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
