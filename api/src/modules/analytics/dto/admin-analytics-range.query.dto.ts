import type { AnalyticsRange } from '@ishraqparfums/shared';
import { IsIn, IsOptional } from 'class-validator';

const RANGES: AnalyticsRange[] = ['7d', '30d', '90d', 'all'];

export class AdminAnalyticsRangeQueryDto {
  @IsOptional()
  @IsIn(RANGES)
  range: AnalyticsRange = '30d';
}
