import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';
import { sendBookingConfirmedEmail } from '../../../utils/mailer';

/**
 * POST /api/admin/orders/status  { orderId, action: 'approve' | 'cancel' }
 *
 * Admin-only. Approves or cancels a **pending bank-transfer** order:
 *  - approve → payment_status/status = 'paid' (+ paid_at), then a confirmation
 *    email is sent to the buyer (best-effort).
 *  - cancel  → payment_status/status = 'cancelled'.
 *
 * Security: the caller must be authenticated AND an admin (checked via the
 * SECURITY DEFINER `is_admin()` RPC). The write itself is additionally gated by
 * the `orders_update_admin` RLS policy. Only bank-transfer orders still in
 * `pending` can be transitioned here — Moyasar orders are confirmed by the
 * gateway, not by hand.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const uid = (user as { id?: string; sub?: string } | null)?.id ?? (user as { sub?: string } | null)?.sub;
  if (!uid) {
    throw createError({ statusCode: 401, statusMessage: 'الرجاء تسجيل الدخول.' });
  }

  const client = await serverSupabaseClient<Database>(event);

  // Verify admin role server-side (never trust the client).
  const { data: isAdmin, error: adminError } = await client.rpc('is_admin');
  if (adminError || isAdmin !== true) {
    throw createError({ statusCode: 403, statusMessage: 'صلاحيات الإدارة مطلوبة.' });
  }

  const body = await readBody<{ orderId?: string; action?: string }>(event).catch(() => ({}));
  const orderId = typeof body?.orderId === 'string' ? body.orderId.trim() : '';
  const action = body?.action;
  if (!orderId) throw createError({ statusCode: 400, statusMessage: 'رقم الطلب مطلوب.' });
  if (action !== 'approve' && action !== 'cancel') {
    throw createError({ statusCode: 400, statusMessage: 'الإجراء غير صالح.' });
  }

  // Load the order (admin RLS select policy allows this).
  const { data: order, error: orderError } = await client
    .from('orders')
    .select('id, status, payment_method, payment_status, total, currency, customer_email, user_id, order_items(title, quantity)')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw createError({ statusCode: 404, statusMessage: 'لم يتم العثور على الطلب.' });
  }
  if (order.payment_method !== 'bank_transfer') {
    throw createError({ statusCode: 409, statusMessage: 'هذا الإجراء متاح لطلبات التحويل البنكي فقط.' });
  }
  if (order.payment_status !== 'pending') {
    throw createError({ statusCode: 409, statusMessage: 'تم البتّ في هذا الطلب مسبقًا.' });
  }

  const approve = action === 'approve';
  const { error: updateError } = await client
    .from('orders')
    .update({
      status: approve ? 'paid' : 'cancelled',
      payment_status: approve ? 'paid' : 'cancelled',
      paid_at: approve ? new Date().toISOString() : null,
    })
    .eq('id', orderId);

  if (updateError) {
    throw createError({ statusCode: 500, statusMessage: updateError.message });
  }

  // On approval, email the buyer that the payment was received & trip booked.
  if (approve) {
    let recipient = order.customer_email ?? '';
    // Fallback: look the email up via the auth admin API (service role) for
    // legacy orders created before customer_email was captured.
    if (!recipient) {
      try {
        const admin = serverSupabaseServiceRole<Database>(event);
        const { data } = await admin.auth.admin.getUserById(order.user_id);
        recipient = data?.user?.email ?? '';
      } catch {
        // service role not configured — nothing more we can do.
      }
    }

    if (recipient) {
      const items = (order.order_items ?? [])
        .map((i) => `${i.title ?? '—'}${i.quantity > 1 ? ` ×${i.quantity}` : ''}`)
        .join('، ');
      try {
        await sendBookingConfirmedEmail({
          to: recipient,
          orderId: order.id,
          total: Number(order.total),
          currency: order.currency,
          items,
        });
      } catch (err) {
        console.error('[admin/orders/status] failed to send confirmation email:', err);
      }
    } else {
      console.warn('[admin/orders/status] no recipient email for order', order.id);
    }
  }

  return { ok: true, payment_status: approve ? 'paid' : 'cancelled' };
});
