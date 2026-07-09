import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/database.types';
import { fetchMoyasarPayment, orderIdFromPayment, type MoyasarPayment } from '../../utils/moyasar';

/**
 * POST /api/payments/webhook
 *
 * Moyasar's server-to-server confirmation. This is the redundant path to the
 * redirect callback: it fires even if the shopper closes the tab. Body shape:
 *   { id, type, created_at, secret_token, data: { ...payment } }
 *
 * Security:
 *  - We check `secret_token` against MOYASAR_WEBHOOK_SECRET (set the same value
 *    in the Moyasar dashboard → Webhooks).
 *  - We re-fetch the payment from the Moyasar API (secret key) rather than
 *    trusting the posted body for status/amount.
 *  - Updates run under the service role because there is no user session here;
 *    RLS would otherwise block the write. If SUPABASE_SERVICE_KEY is not set we
 *    log and no-op (the redirect callback still confirms interactively).
 *
 * Idempotent: an order already `paid` is left untouched, and payment_ref is
 * unique, so double delivery is a no-op.
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);
  const body = await readBody<{ secret_token?: string; data?: MoyasarPayment; type?: string }>(event);

  // 1) Verify the shared secret when configured.
  const expectedSecret = config.moyasarWebhookSecret as string;
  if (expectedSecret && body?.secret_token !== expectedSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid webhook secret' });
  }

  const posted = body?.data;
  const paymentId = posted?.id;
  if (!paymentId) {
    throw createError({ statusCode: 400, statusMessage: 'Missing payment id' });
  }

  // 2) Re-fetch the authoritative payment from Moyasar (don't trust the body).
  let payment: MoyasarPayment;
  try {
    payment = await fetchMoyasarPayment(paymentId, config.moyasarSecretKey as string);
  } catch {
    // Can't verify (e.g. secret key not set) — accept to stop retries; the
    // interactive callback remains the source of truth in that case.
    return { ok: false, reason: 'verification_unavailable' };
  }

  const orderId = orderIdFromPayment(payment);
  if (!orderId) return { ok: false, reason: 'missing_order' };

  // 3) Update under the service role (no user session on a webhook).
  let admin;
  try {
    admin = serverSupabaseServiceRole<Database>(event);
  } catch {
    // SUPABASE_SERVICE_KEY not configured — rely on the redirect callback.
    return { ok: false, reason: 'service_role_unavailable' };
  }

  const { data: order } = await admin
    .from('orders')
    .select('id, total, status')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return { ok: false, reason: 'order_not_found' };
  if (order.status === 'paid') return { ok: true, alreadyPaid: true };

  const amountOk = payment.amount === Math.round(Number(order.total) * 100);
  const paid = payment.status === 'paid' && amountOk;

  await admin
    .from('orders')
    .update({
      status: paid ? 'paid' : 'failed',
      payment_ref: payment.id,
      payment_provider: 'moyasar',
      payment_method: 'moyasar',
      payment_status: paid ? 'paid' : 'failed',
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq('id', orderId);

  // On confirmation, clear the buyer's cart too (service role bypasses RLS).
  if (paid) {
    const { data: full } = await admin.from('orders').select('user_id').eq('id', orderId).maybeSingle();
    if (full?.user_id) await admin.from('cart_items').delete().eq('user_id', full.user_id);
  }

  return { ok: true, status: paid ? 'paid' : 'failed' };
});
