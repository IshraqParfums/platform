import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { resolveAdminAuthEnv } from '../../../config';

type SupabaseClient = ReturnType<typeof createClient>;

/**
 * Builds a fresh, stateless Supabase Auth client per call rather than caching one.
 * Auth operations (signIn/refresh/setSession/signOut) mutate in-memory session state
 * on the client instance they run on and can schedule background refresh timers —
 * sharing one instance across concurrent requests risks cross-request session
 * confusion. Storage's client (media/supabase-storage.client.ts) is safe to cache
 * because Storage calls are stateless.
 *
 * Credentials resolve on use so missing admin-auth env does not block Nest boot.
 */
@Injectable()
export class SupabaseAuthClient {
  create(): SupabaseClient {
    const { url, anonKey } = resolveAdminAuthEnv();
    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
}
