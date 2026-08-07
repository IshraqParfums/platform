import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { AdminBespokeController } from './admin-bespoke.controller';
import { BespokeDataService } from './bespoke-data.service';
import { BespokePricingService } from './bespoke-pricing.service';
import { BespokePruneScheduler } from './bespoke-prune.scheduler';
import { BespokeSessionRepository } from './bespoke-session.repository';
import { BespokeSessionService } from './bespoke-session.service';
import { BespokeController } from './bespoke.controller';
import { BespokeRepository } from './bespoke.repository';
import { BespokeService } from './bespoke.service';

@Module({
  imports: [AuthModule, AdminModule],
  controllers: [BespokeController, AdminBespokeController],
  providers: [
    BespokeDataService,
    BespokeRepository,
    BespokeSessionRepository,
    BespokeService,
    BespokeSessionService,
    BespokePricingService,
    BespokePruneScheduler,
  ],
  exports: [BespokeService, BespokePricingService],
})
export class BespokeModule {}
