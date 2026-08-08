import { HttpStatus, ServiceUnavailableException } from '@nestjs/common';

export type FeatureId = 'payments' | 'otp' | 'admin-auth' | 'media';

/**
 * Feature credentials missing or incomplete — HTTP 503 with a stable body
 * so BFF/FE can surface `message` without parsing Nest internals.
 */
export class FeatureUnavailableException extends ServiceUnavailableException {
  readonly feature: FeatureId;

  constructor(feature: FeatureId, message: string) {
    super({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      error: 'FEATURE_UNAVAILABLE',
      feature,
      message,
    });
    this.feature = feature;
  }
}
