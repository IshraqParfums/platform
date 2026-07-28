import type { AdminSummary } from '@ishraqparfums/shared';
import type { Admin } from '@prisma/client';

export function toAdminSummary(admin: Admin): AdminSummary {
  return {
    id: admin.id,
    email: admin.email,
    supabaseUserId: admin.supabaseUserId,
  };
}
