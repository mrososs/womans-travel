import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';

/**
 * POST /api/orders/cancel  { orderId }
 *
 * Cancels one of the signed-in shopper's bookings. Free cancellation is only
 * allowed within CANCEL_WINDOW_HOURS of purchase; the window is enforced here
 * (server-side) so it can't be bypassed from the client. RLS scopes every read
 * and write to the order's owner.
 */

// Free-cancellation window, measured from when the order was placed.
export const CANCEL_WINDOW_HOURS = 48;

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const uid = (user as { id?: string; sub?: string } | null)?.id ?? (user as { sub?: string } | null)?.sub;
  if (!uid) {
    throw createError({ statusCode: 401, statusMessage: 'الرجاء تسجيل الدخول.' });
  }

  const body = await readBody<{ orderId?: string }>(event).catch(() => ({}));
  const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
  if (!orderId) {
    throw createError({ statusCode: 400, statusMessage: 'رقم الطلب مطلوب.' });
  }

  const client = await serverSupabaseClient<Database>(event);

  // RLS ensures we can only read our own order.
  const { data: order, error } = await client
    .from('orders')
    .select('id, status, created_at')
    .eq('id', orderId)
    .single();

  if (error || !order) {
    throw createError({ statusCode: 404, statusMessage: 'لم يتم العثور على الحجز.' });
  }

  if (order.status === 'cancelled') {
    return { ok: true, status: 'cancelled' as const };
  }
  if (order.status !== 'paid') {
    throw createError({ statusCode: 409, statusMessage: 'لا يمكن إلغاء هذا الحجز.' });
  }

  const ageMs = Date.now() - new Date(order.created_at).getTime();
  if (ageMs > CANCEL_WINDOW_HOURS * 60 * 60 * 1000) {
    throw createError({
      statusCode: 409,
      statusMessage: `انتهت فترة الإلغاء المجاني (${CANCEL_WINDOW_HOURS} ساعة).`,
    });
  }

  const { error: updateError } = await client
    .from('orders')
    .update({ status: 'cancelled' })
    .eq('id', orderId);

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: updateError.message });
  }

  return { ok: true, status: 'cancelled' as const };
});
