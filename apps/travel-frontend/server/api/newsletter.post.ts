import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/types/database.types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST /api/newsletter — subscribe an email to the newsletter. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const email = String(body?.email ?? '').trim().toLowerCase();
  const locale = body?.locale === 'en' ? 'en' : 'ar';

  if (!EMAIL_RE.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'A valid email is required' });
  }

  const client = await serverSupabaseClient<Database>(event);
  const { error } = await client
    .from('newsletter_subscribers')
    .insert({ email, locale });

  // 23505 = unique_violation → already subscribed, treat as success.
  if (error && error.code !== '23505') {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }
  return { ok: true };
});
