import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';
import {
  captureTabbyPayment,
  fetchTabbyPayment,
  getTabbySecretKey,
  orderIdFromPayment,
} from '../../../utils/tabby';

/**
 * GET /api/payments/tabby/callback
 *
 * Tabby redirects the shopper's browser here after the hosted checkout with
 * `?status=success|cancel|failure&payment_id=…`. We re-fetch the payment from
 * the Tabby API (secret key) and only mark the order `paid` if Tabby itself
 * reports AUTHORIZED/CLOSED AND the amount matches — the client is never
 * trusted. On success we capture the full amount (settlement) and clear the
 * cart, then redirect to the success/failed page.
 *
 * The Supabase session cookie rides along on this redirect, so we update the
 * shopper's own order under RLS. The webhook is the redundant, session-less
 * confirmation path.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const status = typeof query.status === 'string' ? query.status : '';
  const paymentId =
    (typeof query.payment_id === 'string' && query.payment_id) ||
    (typeof query.id === 'string' && query.id) ||
    '';

  const fail = (reason: string, orderId?: string) => {
    const params = new URLSearchParams({ reason });
    if (orderId) params.set('order', orderId);
    return sendRedirect(event, `/checkout/failed?${params.toString()}`, 302);
  };

  // Shopper backed out on Tabby's page — no charge, no order confirmation.
  if (status === 'cancel') return fail('cancelled');
  if (!paymentId) return fail('missing_payment');

  let secretKey: string;
  try {
    secretKey = await getTabbySecretKey(event);
  } catch {
    return fail('verification_failed');
  }

  let payment;
  try {
    payment = await fetchTabbyPayment(paymentId, secretKey);
  } catch {
    return fail('verification_failed');
  }

  const orderId = orderIdFromPayment(payment);
  if (!orderId) return fail('missing_order');

  const user = await serverSupabaseUser(event).catch(() => null);
  const uid =
    (user as { id?: string; sub?: string } | null)?.id ??
    (user as { sub?: string } | null)?.sub;
  const client = await serverSupabaseClient<Database>(event);

  const { data: order } = await client
    .from('orders')
    .select('id, total, status')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return fail('order_not_found', orderId);

  // Already confirmed by the webhook (or a previous callback) — done.
  if (order.status === 'paid') {
    if (uid) await client.from('cart_items').delete().eq('user_id', uid);
    return sendRedirect(event, `/checkout/success?order=${orderId}`, 302);
  }

  const amountOk = Number(payment.amount) === Math.round(Number(order.total) * 100) / 100;
  const authorized = payment.status === 'AUTHORIZED' || payment.status === 'CLOSED';
  const paid = authorized && amountOk;

  if (!paid) {
    await client
      .from('orders')
      .update({
        status: 'failed',
        payment_ref: payment.id,
        payment_provider: 'tabby',
        payment_method: 'tabby',
        payment_status: payment.status.toLowerCase(),
      })
      .eq('id', orderId);
    return fail(amountOk ? payment.status.toLowerCase() : 'amount_mismatch', orderId);
  }

  // Capture the full amount (settlement). Non-fatal if it fails or is already
  // captured — the buyer is committed (AUTHORIZED); an admin can reconcile.
  if (payment.status === 'AUTHORIZED') {
    await captureTabbyPayment(payment.id, Number(order.total), secretKey).catch(() => null);
  }

  await client
    .from('orders')
    .update({
      status: 'paid',
      payment_ref: payment.id,
      payment_provider: 'tabby',
      payment_method: 'tabby',
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (uid) await client.from('cart_items').delete().eq('user_id', uid);
  return sendRedirect(event, `/checkout/success?order=${orderId}`, 302);
});
