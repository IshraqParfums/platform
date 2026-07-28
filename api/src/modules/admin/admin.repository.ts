import { Injectable } from '@nestjs/common';
import type { Admin } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  findBySupabaseUserId(supabaseUserId: string): Promise<Admin | null> {
    return this.prisma.admin.findUnique({
      where: { supabaseUserId },
    });
  }
}
