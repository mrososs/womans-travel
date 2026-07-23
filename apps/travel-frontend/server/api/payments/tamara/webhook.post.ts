import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/database.types';
import {
  authoriseTamaraOrder,
  captureTamaraOrder,
  getTamaraApiToken,
  getTamaraNotificationToken,
  getTamaraOrder,
  isTamaraPaidStatus,
  tamaraBase,
  verifyTamaraToken,
} from '../../../utils/tamara';

/**
 * POST /api/payments/tamara/webhook
 *
 * Tamara's server-to-server order-status notifications. Redundant to the
 * redirect callback. Authenticity is enforced by verifying the `tamaraToken`
 * (HS256 JWT signed with the notification token) sent as a Bearer header and/or
 * `tamaraToken` query param, then re-fetching the order from the Tamara API.
 *
 * On `approved` we authorise; on `authorised` we capture. Idempotent: an order
 * already `paid` is left untouched. Runs under the service role (no session).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<{ order_id?: string; order_reference_id?: string; event_type?: string }>(
    event
  ).catch(() => null);
  const tamaraOrderId = body?.order_id;
  if (!tamaraOrderId) throw createError({ statusCode: 400, statusMessage: 'Missing order id' });

  // 1) Verify the tamaraToken (Bearer header or ?tamaraToken=) against the secret.
  const notifToken = await getTamaraNotificationToken(event);
  if (notifToken) {
    const q = getQuery(event);
    const provided =
      (getHeader(event, 'authorization') || '').replace(/^Bearer\s+/i, '') ||
      (typeof q.tamaraToken === 'string' ? q.tamaraToken : '');
    if (!provided || !verifyTamaraToken(provided, notifToken)) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid tamaraToken' });
    }
  }

  // 2) Service-role client (no user session on a webhook).
  let admin;
  try {
    admin = serverSupabaseServiceRole<Database>(event);
  } catch {
    return { ok: false, reason: 'service_role_unavailable' };
  }

  const { data: settings } = await admin
    .from('payment_settings')
    .select('tamara_test_mode')
    .eq('id', 1)
    .maybeSingle();
  const testMode = settings?.tamara_test_mode !== false;
  const base = tamaraBase(testMode);

  let token: string;
  try {
    token = await getTamaraApiToken(event);
  } catch {
    return { ok: false, reason: 'verification_unavailable' };
  }

  // 3) Re-fetch the authoritative order from Tamara.
  const tOrder = await getTamaraOrder(base, token, tamaraOrderId);
  if (!tOrder) return { ok: false, reason: 'verification_unavailable' };

  const orderId = tOrder.order_reference_id || '';
  if (!orderId) return { ok: false, reason: 'missing_order' };

  const { data: order } = await admin
    .from('orders')
    .select('id, total, status, user_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return { ok: false, reason: 'order_not_found' };
  if (order.status === 'paid') return { ok: true, alreadyPaid: true };

  const amountOk =
    tOrder.total_amount?.amount != null &&
    Number(tOrder.total_amount.amount) === Math.round(Number(order.total) * 100) / 100;

  let statusNow = String(tOrder.status).toLowerCase();
  if (statusNow === 'approved') {
    const auth = await authoriseTamaraOrder(base, token, tamaraOrderId);
    if (auth.ok) statusNow = 'authorised';
  }

  const committed = statusNow === 'approved' || isTamaraPaidStatus(statusNow);
  const paid = committed && amountOk;

  if (paid && statusNow === 'authorised') {
    await captureTamaraOrder(base, token, tamaraOrderId, Number(order.total), 'SAR').catch(() => null);
  }

  await admin
    .from('orders')
    .update({
      status: paid ? 'paid' : 'failed',
      payment_ref: tamaraOrderId,
      payment_provider: 'tamara',
      payment_method: 'tamara',
      payment_status: paid ? 'paid' : statusNow,
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq('id', orderId);

  if (paid && order.user_id) {
    await admin.from('cart_items').delete().eq('user_id', order.user_id);
  }

  return { ok: true, status: paid ? 'paid' : statusNow };
});
