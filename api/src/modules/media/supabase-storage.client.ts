import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { resolveMediaEnv } from '../../config';

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Supabase Storage client for product image uploads. Credentials resolve on
 * first use so missing media env does not block Nest boot or storefront reads.
 */
@Injectable()
export class SupabaseStorageClient {
  private client: SupabaseClient | null = null;

  private ensure(): SupabaseClient {
    if (this.client) return this.client;
    const { url, serviceRoleKey } = resolveMediaEnv();
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false },
    });
    return this.client;
  }

  get storage(): SupabaseClient['storage'] {
    return this.ensure().storage;
  }
}
