import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/types/database.types';

/** POST /api/contact — store a contact message. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const message = String(body?.message ?? '').trim();

  if (!name || !email || !message) {
    throw createError({ statusCode: 400, statusMessage: 'name, email and message are required' });
  }

  const client = await serverSupabaseClient<Database>(event);
  const { error } = await client
    .from('contact_messages')
    .insert({ name, email, phone: body.phone ?? null, message });

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return { ok: true };
});
