import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/types/database.types';

/**
 * GET /api/trips?kind=intl|local&category=beach&featured=true
 * Reads trips from Supabase (publicly readable via RLS).
 */
export default defineEventHandler(async (event) => {
  const { kind, category, featured } = getQuery(event);
  const client = await serverSupabaseClient<Database>(event);

  let query = client.from('trips').select('*').order('created_at', { ascending: true });
  if (kind === 'intl' || kind === 'local') query = query.eq('kind', kind);
  if (typeof category === 'string' && category) query = query.eq('category_id', category);
  if (featured === 'true') query = query.eq('featured', true);

  const { data, error } = await query;
  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return data;
});
