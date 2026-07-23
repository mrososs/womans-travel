import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';
import {
  authoriseTamaraOrder,
  captureTamaraOrder,
  getTamaraApiToken,
  getTamaraOrder,
  isTamaraPaidStatus,
  tamaraBase,
} from '../../../utils/tamara';

/**
 * GET /api/payments/tamara/callback
 *
 * Tamara redirects the shopper's browser here after the hosted checkout with
 * `?status=success|failure|cancel&orderId=<tamara order id>`. We re-fetch the
 * order from the Tamara API (never trust the redirect), then drive it to
 * settlement: `approved` → authorise → capture. We mark our order `paid` once
 * Tamara reports authorised/captured AND the amount matches.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const status = typeof query.status === 'string' ? query.status : '';
  const tamaraOrderId =
    (typeof query.orderId === 'string' && query.orderId) ||
    (typeof query.order_id === 'string' && query.order_id) ||
    '';

  const fail = (reason: string, orderId?: string) => {
    const params = new URLSearchParams({ reason });
    if (orderId) params.set('order', orderId);
    return sendRedirect(event, `/checkout/failed?${params.toString()}`, 302);
  };

  if (status === 'cancel') return fail('cancelled');
  if (!tamaraOrderId) return fail('missing_payment');

  const client = await serverSupabaseClient<Database>(event);
  const { data: settings } = await client
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
    return fail('verification_failed');
  }

  const tOrder = await getTamaraOrder(base, token, tamaraOrderId);
  if (!tOrder) return fail('verification_failed');

  const orderId = tOrder.order_reference_id || '';
  if (!orderId) return fail('missing_order');

  const user = await serverSupabaseUser(event).catch(() => null);
  const uid =
    (user as { id?: string; sub?: string } | null)?.id ??
    (user as { sub?: string } | null)?.sub;

  const { data: order } = await client
    .from('orders')
    .select('id, total, status')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return fail('order_not_found', orderId);

  if (order.status === 'paid') {
    if (uid) await client.from('cart_items').delete().eq('user_id', uid);
    return sendRedirect(event, `/checkout/success?order=${orderId}`, 302);
  }

  const amountOk =
    tOrder.total_amount?.amount != null &&
    Number(tOrder.total_amount.amount) === Math.round(Number(order.total) * 100) / 100;

  let statusNow = String(tOrder.status).toLowerCase();

  // Approved → authorise (required before capture).
  if (statusNow === 'approved') {
    const auth = await authoriseTamaraOrder(base, token, tamaraOrderId);
    if (auth.ok) statusNow = 'authorised';
  }

  const committed = statusNow === 'approved' || isTamaraPaidStatus(statusNow);
  const paid = committed && amountOk;

  if (!paid) {
    await client
      .from('orders')
      .update({
        status: 'failed',
        payment_ref: tamaraOrderId,
        payment_provider: 'tamara',
        payment_method: 'tamara',
        payment_status: statusNow,
      })
      .eq('id', orderId);
    return fail(amountOk ? statusNow : 'amount_mismatch', orderId);
  }

  // Capture the full amount (settlement) once authorised.
  if (statusNow === 'authorised') {
    await captureTamaraOrder(base, token, tamaraOrderId, Number(order.total), 'SAR').catch(() => null);
  }

  await client
    .from('orders')
    .update({
      status: 'paid',
      payment_ref: tamaraOrderId,
      payment_provider: 'tamara',
      payment_method: 'tamara',
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (uid) await client.from('cart_items').delete().eq('user_id', uid);
  return sendRedirect(event, `/checkout/success?order=${orderId}`, 302);
});
