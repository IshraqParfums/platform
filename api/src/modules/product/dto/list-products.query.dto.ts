import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import {
  PRODUCT_LIST_SORTS,
  type ProductListSort,
} from '@ishraqparfums/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.query.dto';

export class ListProductsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  collection?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  q?: string;

  @IsOptional()
  @IsIn(PRODUCT_LIST_SORTS)
  sort?: ProductListSort;
}
