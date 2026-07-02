import { serverSupabaseClient } from '#supabase/server';
import type { Database } from '~/types/database.types';

/** POST /api/bookings — create a trip booking request. */
export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const fullName = String(body?.fullName ?? '').trim();
  const email = String(body?.email ?? '').trim();

  if (!fullName || !email) {
    throw createError({ statusCode: 400, statusMessage: 'fullName and email are required' });
  }

  // Insert only (no .select()): bookings are private — the public anon role has
  // an INSERT policy but no SELECT policy, so reading the row back would fail RLS.
  const client = await serverSupabaseClient<Database>(event);
  const { error } = await client.from('bookings').insert({
    trip_id: body.tripId ?? null,
    full_name: fullName,
    email,
    phone: body.phone ?? null,
    travellers: Number(body.travellers) || 1,
    room_type: body.roomType ?? null,
    trip_date: body.tripDate ?? null,
    notes: body.notes ?? null,
  });

  if (error) throw createError({ statusCode: 500, statusMessage: error.message });
  return { ok: true };
});
