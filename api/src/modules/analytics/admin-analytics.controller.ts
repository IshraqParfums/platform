import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import type {
  AdminAnalyticsOverview,
  AdminOrderStatusBreakdownResponse,
  AdminRevenueSeriesResponse,
  AdminTopProductsResponse,
} from '@ishraqparfums/shared';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { AnalyticsService } from './analytics.service';
import { AdminAnalyticsRangeQueryDto } from './dto/admin-analytics-range.query.dto';
import { AdminOverviewQueryDto } from './dto/admin-overview.query.dto';
import { AdminTopProductsQueryDto } from './dto/admin-top-products.query.dto';

@Controller('admin/analytics')
@UseGuards(AdminJwtGuard)
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  overview(
    @Query() query: AdminOverviewQueryDto,
  ): Promise<AdminAnalyticsOverview> {
    return this.analyticsService.getOverview(query.range, query.threshold);
  }

  @Get('revenue-series')
  revenueSeries(
    @Query() query: AdminAnalyticsRangeQueryDto,
  ): Promise<AdminRevenueSeriesResponse> {
    return this.analyticsService.getRevenueSeries(query.range);
  }

  @Get('order-status-breakdown')
  orderStatusBreakdown(
    @Query() query: AdminAnalyticsRangeQueryDto,
  ): Promise<AdminOrderStatusBreakdownResponse> {
    return this.analyticsService.getOrderStatusBreakdown(query.range);
  }

  @Get('top-products')
  topProducts(
    @Query() query: AdminTopProductsQueryDto,
  ): Promise<AdminTopProductsResponse> {
    return this.analyticsService.getTopProducts(query.range, query.limit);
  }
}
