import { IsIn, IsOptional } from 'class-validator';
import {
  CUSTOMER_ORDER_STATUS_GROUP_IDS,
  type CustomerOrderStatusGroup,
} from '@ishraqparfums/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.query.dto';

export class ListCustomerOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn([...CUSTOMER_ORDER_STATUS_GROUP_IDS])
  statusGroup?: CustomerOrderStatusGroup;
}
