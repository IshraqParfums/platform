import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Builds a fresh, stateless Supabase Auth client per call rather than caching one.
 * Auth operations (signIn/refresh/setSession/signOut) mutate in-memory session state
 * on the client instance they run on and can schedule background refresh timers —
 * sharing one instance across concurrent requests risks cross-request session
 * confusion. Storage's client (media/supabase-storage.client.ts) is safe to cache
 * because Storage calls are stateless.
 */
@Injectable()
export class SupabaseAuthClient {
  private readonly url: string;
  private readonly anonKey: string;

  constructor(configService: ConfigService) {
    this.url = configService.getOrThrow<string>('SUPABASE_URL');
    this.anonKey = configService.getOrThrow<string>('SUPABASE_ANON_KEY');
  }

  create(): SupabaseClient {
    return createClient(this.url, this.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}
