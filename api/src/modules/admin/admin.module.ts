import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminRepository, AdminService, AdminJwtGuard],
  exports: [AdminJwtGuard, AdminService],
})
export class AdminModule {}
