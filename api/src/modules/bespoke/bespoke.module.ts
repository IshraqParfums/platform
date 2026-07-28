import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BespokePricingService } from './bespoke-pricing.service';
import { BespokeController } from './bespoke.controller';
import { BespokeRepository } from './bespoke.repository';
import { BespokeService } from './bespoke.service';

@Module({
  imports: [AuthModule],
  controllers: [BespokeController],
  providers: [BespokeRepository, BespokeService, BespokePricingService],
  exports: [BespokeService, BespokePricingService],
})
export class BespokeModule {}
