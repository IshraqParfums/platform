import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { AdminAnalyticsRangeQueryDto } from './admin-analytics-range.query.dto';

export class AdminOverviewQueryDto extends AdminAnalyticsRangeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  threshold: number = 5;
}
