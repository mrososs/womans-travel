import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';
import { fetchMoyasarPayment, orderIdFromPayment } from '../../utils/moyasar';

/**
 * GET /api/payments/callback
 *
 * Moyasar redirects the shopper's browser here after the hosted form finishes
 * (query: `id`, `status`, `message`). We re-fetch the payment from the Moyasar
 * API with the secret key and only mark the order `paid` if Moyasar itself
 * reports `paid` AND the amount matches what we stored — the client is never
 * trusted. On success the user's cart is cleared. Then we redirect to a
 * success/failed page.
 *
 * The user's Supabase session cookie rides along on this redirect, so we can
 * update their own order under RLS. The webhook is the redundant, session-less
 * confirmation path.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const paymentId = typeof query.id === 'string' ? query.id : '';

  const fail = (reason: string, orderId?: string) => {
    const params = new URLSearchParams({ reason });
    if (orderId) params.set('order', orderId);
    return sendRedirect(event, `/checkout/failed?${params.toString()}`, 302);
  };

  if (!paymentId) return fail('missing_payment');

  const config = useRuntimeConfig(event);
  const secretKey = config.moyasarSecretKey as string;

  let payment;
  try {
    payment = await fetchMoyasarPayment(paymentId, secretKey);
  } catch {
    // Secret key missing/invalid, or Moyasar unreachable — do NOT mark paid.
    return fail('verification_failed');
  }

  const orderId = orderIdFromPayment(payment);
  if (!orderId) return fail('missing_order');

  const user = await serverSupabaseUser(event).catch(() => null);
  // serverSupabaseUser returns JWT claims (user id is `sub`, not `id`).
  const uid = (user as { id?: string; sub?: string } | null)?.id ?? (user as { sub?: string } | null)?.sub;
  const client = await serverSupabaseClient<Database>(event);

  // Load the order to verify the amount before trusting the payment.
  const { data: order } = await client
    .from('orders')
    .select('id, total, currency, status')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return fail('order_not_found', orderId);

  const expected = Math.round(Number(order.total) * 100);
  const amountOk = payment.amount === expected;
  const paid = payment.status === 'paid' && amountOk;

  await client
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

  if (paid) {
    // Clear the shopper's cart now that the order is confirmed.
    if (uid) await client.from('cart_items').delete().eq('user_id', uid);
    return sendRedirect(event, `/checkout/success?order=${orderId}`, 302);
  }

  return fail(amountOk ? (payment.status || 'unpaid') : 'amount_mismatch', orderId);
});
