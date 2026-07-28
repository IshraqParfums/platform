import { ForbiddenException, Injectable } from '@nestjs/common';
import type { AdminSummary } from '@ishraqparfums/shared';
import { AdminRepository } from './admin.repository';
import { toAdminSummary } from './mappers/admin.mapper';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  async getBySupabaseUserIdOrThrow(
    supabaseUserId: string,
  ): Promise<AdminSummary> {
    const admin =
      await this.adminRepository.findBySupabaseUserId(supabaseUserId);

    if (!admin) {
      throw new ForbiddenException('Admin access required.');
    }

    return toAdminSummary(admin);
  }
}
