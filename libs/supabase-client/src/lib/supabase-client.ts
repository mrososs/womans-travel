import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseClientOptions {
  /** Supabase project URL, e.g. https://xxxx.supabase.co */
  url: string;
  /** Supabase anon/public key. */
  key: string;
}

/**
 * Create a standalone Supabase client.
 *
 * Inside the Nuxt app, prefer the auto-imported `useSupabaseClient()` composable
 * provided by the `@nuxtjs/supabase` module. Use this factory for non-Nuxt
 * contexts (scripts, tests, server utilities) or when you need an explicit client.
 */
export function createSupabaseClient({
  url,
  key,
}: SupabaseClientOptions): SupabaseClient {
  if (!url || !key) {
    throw new Error(
      'createSupabaseClient: `url` and `key` are required (see SUPABASE_URL / SUPABASE_KEY).'
    );
  }

  return createClient(url, key);
}

export type { SupabaseClient };
