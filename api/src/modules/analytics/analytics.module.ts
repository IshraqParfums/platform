import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [AdminModule],
  controllers: [AdminAnalyticsController],
  providers: [AnalyticsRepository, AnalyticsService],
})
export class AnalyticsModule {}
