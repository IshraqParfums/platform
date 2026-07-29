import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import { SupabaseAuthClient } from './auth/supabase-auth.client';
import { AdminJwtGuard } from './guards/admin-jwt.guard';

@Module({
  controllers: [AdminController, AdminAuthController],
  providers: [
    AdminRepository,
    AdminService,
    AdminJwtGuard,
    AdminAuthService,
    SupabaseAuthClient,
  ],
  exports: [AdminJwtGuard, AdminService],
})
export class AdminModule {}
