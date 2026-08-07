import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { AdminAnalyticsRangeQueryDto } from './admin-analytics-range.query.dto';

export class AdminTopProductsQueryDto extends AdminAnalyticsRangeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 10;
}
