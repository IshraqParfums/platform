import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { ADMIN_ORDER_STATUS_GROUP_IDS } from '@ishraqparfums/shared';
import type { AdminOrderStatusGroup } from '@ishraqparfums/shared';
import { PaginationQueryDto } from '../../../common/dto/pagination.query.dto';

export class AdminListOrdersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsIn([...ADMIN_ORDER_STATUS_GROUP_IDS])
  statusGroup?: AdminOrderStatusGroup;

  @IsOptional()
  @IsUUID()
  customerId?: string;
}
