import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class AdjustStockDto {
  /** Delta — positive to restock, negative for damage/shrinkage. Mutually exclusive with `stockQty`. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  adjustment?: number;

  /** Absolute set, e.g. after a physical stock count. Mutually exclusive with `adjustment`. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQty?: number;
}
