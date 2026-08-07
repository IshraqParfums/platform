import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  BespokeAdminAnalytics,
  BespokeAdminListItem,
  BespokePerfumeAdminResponse,
  PaginatedResponse,
} from '@ishraqparfums/shared';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { BespokeService } from './bespoke.service';
import {
  AdminBespokeAnalyticsQueryDto,
  AdminBespokeListQueryDto,
} from './dto/bespoke.dto';

@Controller('admin/bespoke')
@UseGuards(AdminJwtGuard)
export class AdminBespokeController {
  constructor(private readonly bespokeService: BespokeService) {}

  @Get()
  list(
    @Query() query: AdminBespokeListQueryDto,
  ): Promise<PaginatedResponse<BespokeAdminListItem>> {
    return this.bespokeService.adminList(
      query.page,
      query.pageSize,
      query.includeDeleted ?? false,
      query.customerId,
    );
  }

  @Get('analytics')
  analytics(
    @Query() query: AdminBespokeAnalyticsQueryDto,
  ): Promise<BespokeAdminAnalytics> {
    return this.bespokeService.adminAnalytics(query.days);
  }

  @Get(':id')
  detail(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BespokePerfumeAdminResponse> {
    return this.bespokeService.adminGetById(id);
  }
}
