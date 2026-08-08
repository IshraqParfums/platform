import { Module } from '@nestjs/common';
import { AdminModule } from '../admin/admin.module';
import { AuthModule } from '../auth/auth.module';
import { AdminBespokeAtelierController } from './admin-bespoke-atelier.controller';
import { AdminBespokeController } from './admin-bespoke.controller';
import { BespokeAtelierService } from './bespoke-atelier.service';
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
  controllers: [
    BespokeController,
    AdminBespokeController,
    AdminBespokeAtelierController,
  ],
  providers: [
    BespokeAtelierService,
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
