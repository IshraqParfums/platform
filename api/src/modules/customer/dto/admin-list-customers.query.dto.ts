import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import {
  ADMIN_CUSTOMER_LIST_SORTS,
  type AdminCustomerListSort,
} from '@ishraqparfums/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.query.dto';

export class AdminListCustomersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  search?: string;

  @IsOptional()
  @IsIn([...ADMIN_CUSTOMER_LIST_SORTS])
  sort?: AdminCustomerListSort;
}
