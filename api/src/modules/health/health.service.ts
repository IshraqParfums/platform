import { Injectable } from '@nestjs/common';
import type { HealthResponse } from '@ishraqparfums/shared';

@Injectable()
export class HealthService {
  getHealth(): HealthResponse {
    return {
      status: 'healthy',
      service: 'ishraqparfums-api',
      timestamp: new Date().toISOString(),
    };
  }
}
