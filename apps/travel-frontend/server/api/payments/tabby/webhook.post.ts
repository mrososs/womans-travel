import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/database.types';
import {
  captureTabbyPayment,
  fetchTabbyPayment,
  getTabbySecretKey,
  getTabbyWebhookSecret,
  orderIdFromPayment,
  type TabbyPayment,
} from '../../../utils/tabby';

/**
 * POST /api/payments/tabby/webhook
 *
 * Tabby's server-to-server confirmation. Redundant to the redirect callback: it
 * fires even if the shopper closes the tab. The body is the payment object.
 *
 * Security:
 *  - We validate the shared secret we registered with the webhook (sent back on
 *    a header we chose) against the `tabby_webhook_secret` Vault entry.
 *  - We re-fetch the payment from the Tabby API (secret key) rather than
 *    trusting the posted body for status/amount.
 *  - Updates run under the service role (no user session on a webhook).
 *
 * Idempotent: an order already `paid` is left untouched.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody<TabbyPayment>(event).catch(() => null);
  const paymentId = body?.id;
  if (!paymentId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing payment id' });
  }

  // 1) Verify the shared secret we set on the webhook registration, when present.
  const expected = await getTabbyWebhookSecret(event);
  if (expected) {
    const provided =
      getHeader(event, 'x-webhook-secret') ||
      getHeader(event, 'x-tabby-signature') ||
      (getHeader(event, 'authorization') || '').replace(/^Bearer\s+/i, '');
    if (provided !== expected) {
      throw createError({ statusCode: 401, statusMessage: 'Invalid webhook secret' });
    }
  }

  // 2) Re-fetch the authoritative payment from Tabby (don't trust the body).
  let secretKey: string;
  try {
    secretKey = await getTabbySecretKey(event);
  } catch {
    return { ok: false, reason: 'verification_unavailable' };
  }
  let payment: TabbyPayment;
  try {
    payment = await fetchTabbyPayment(paymentId, secretKey);
  } catch {
    return { ok: false, reason: 'verification_unavailable' };
  }

  const orderId = orderIdFromPayment(payment);
  if (!orderId) return { ok: false, reason: 'missing_order' };

  // 3) Update under the service role (no user session on a webhook).
  let admin;
  try {
    admin = serverSupabaseServiceRole<Database>(event);
  } catch {
    return { ok: false, reason: 'service_role_unavailable' };
  }

  const { data: order } = await admin
    .from('orders')
    .select('id, total, status, user_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return { ok: false, reason: 'order_not_found' };
  if (order.status === 'paid') return { ok: true, alreadyPaid: true };

  const amountOk = Number(payment.amount) === Math.round(Number(order.total) * 100) / 100;
  const authorized = payment.status === 'AUTHORIZED' || payment.status === 'CLOSED';
  const paid = authorized && amountOk;

  if (paid && payment.status === 'AUTHORIZED') {
    await captureTabbyPayment(payment.id, Number(order.total), secretKey).catch(() => null);
  }

  await admin
    .from('orders')
    .update({
      status: paid ? 'paid' : 'failed',
      payment_ref: payment.id,
      payment_provider: 'tabby',
      payment_method: 'tabby',
      payment_status: paid ? 'paid' : payment.status.toLowerCase(),
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq('id', orderId);

  if (paid && order.user_id) {
    await admin.from('cart_items').delete().eq('user_id', order.user_id);
  }

  return { ok: true, status: paid ? 'paid' : payment.status.toLowerCase() };
});
