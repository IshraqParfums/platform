import { HttpException, HttpStatus } from '@nestjs/common';
import type {
  OtpRateLimitErrorBody,
  OtpRateLimitKind,
} from '@ishraqparfums/shared';

export function throwOtpRateLimited(
  message: string,
  retryAfterSeconds: number,
  limit: OtpRateLimitKind,
): never {
  const body: OtpRateLimitErrorBody = {
    statusCode: 429,
    message,
    retryAfterSeconds: Math.max(1, Math.ceil(retryAfterSeconds)),
    limit,
  };

  throw new HttpException(body, HttpStatus.TOO_MANY_REQUESTS);
}
