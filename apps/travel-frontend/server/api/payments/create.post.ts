import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';
import {
  isDomesticCart,
  normalizeTraveler,
  priceCart,
  reserveCoupon,
  type TravelerInput,
} from '../../utils/checkout';

/**
 * POST /api/payments/create
 *
 * Creates a `pending` order (+ order_items) for the signed-in user from their
 * Supabase cart, recomputing the amount **server-side** (never trusting the
 * client). Returns the amount in halalas so the client can hand it to
 * Moyasar.js. Payment is only confirmed later, server-side, by the
 * callback/webhook once Moyasar reports the charge as paid.
 *
 * If the cart is empty we fall back to a single demo trip so the flow is always
 * testable in the demo environment (see docs/plan.md §5, §8).
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  // NOTE: serverSupabaseUser returns verified JWT *claims* here, where the user
  // id is `sub` (not `id`). Support both shapes so this is version-proof.
  const uid = (user as { id?: string; sub?: string } | null)?.id ?? (user as { sub?: string } | null)?.sub;
  if (!uid) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in to check out' });
  }
  const email = (user as { email?: string } | null)?.email ?? null;

  const body = await readBody<{ traveler?: TravelerInput; couponCode?: string }>(event).catch(
    () => ({})
  );

  const client = await serverSupabaseClient<Database>(event);

  // 1) Read the authoritative cart + recompute totals server-side. The coupon
  // is re-validated here too — the client's earlier check is never trusted.
  const { lines, subtotal, coupon, discount, vat, total } = await priceCart(
    client,
    uid,
    body?.couponCode
  );

  // 1b) Traveler details captured in the checkout stepper (required before
  // payment) — domestic carts (Red Sea / Taif / Al-Baha / Madinah, etc.) skip
  // the passport fields and use a national ID/iqama instead.
  const domestic = await isDomesticCart(client, lines);
  const traveler = normalizeTraveler(body?.traveler, domestic);

  // 1c) The shopper can change her coupon while the hosted card form is up,
  // which re-runs this endpoint. Any earlier pending card order still holds a
  // reservation on its coupon, so cancel those first — the orders trigger
  // releases the redemption and the fresh order below can claim it. Scoped to
  // coupon-bearing orders so plain checkouts are untouched.
  await client
    .from('orders')
    .update({ status: 'cancelled', payment_status: 'cancelled' })
    .eq('user_id', uid)
    .eq('payment_method', 'moyasar')
    .eq('payment_status', 'pending')
    .not('coupon_id', 'is', null);

  // 2) Create the pending order.
  const { data: order, error: orderError } = await client
    .from('orders')
    .insert({
      user_id: uid,
      status: 'pending',
      currency: 'SAR',
      subtotal,
      total,
      payment_provider: 'moyasar',
      payment_method: 'moyasar',
      payment_status: 'pending',
      customer_email: email,
      coupon_id: coupon?.id ?? null,
      coupon_code: coupon?.code ?? null,
      discount_amount: discount,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    throw createError({ statusCode: 500, statusMessage: orderError?.message ?? 'Could not create order' });
  }

  // 2a) Claim the shopper's single redemption. A collision here (two tabs, or
  // a code spent between validation and now) rejects the checkout rather than
  // letting the discount be taken twice.
  if (coupon) await reserveCoupon(client, coupon, order.id, discount);

  // 2b) Snapshot the traveler manifest onto the order. Done as a separate,
  // fail-soft update so the flow keeps working even if the traveler_info column
  // migration (20260707130000) has not yet been applied to this environment.
  const { error: travelerError } = await client
    .from('orders')
    .update({ traveler_info: traveler })
    .eq('id', order.id);
  if (travelerError) {
    console.warn('[payments/create] could not persist traveler_info:', travelerError.message);
  }

  // 3) Snapshot the line items onto the order.
  const { error: itemsError } = await client.from('order_items').insert(
    lines.map((l) => ({
      order_id: order.id,
      item_type: l.item_type,
      item_id: l.item_id,
      title: l.title,
      quantity: l.quantity,
      unit_price: l.unit_price,
      line_total: l.line_total,
    }))
  );

  if (itemsError) {
    throw createError({ statusCode: 500, statusMessage: itemsError.message });
  }

  return {
    orderId: order.id,
    amount: Math.round(total * 100), // halalas — the value Moyasar charges
    currency: 'SAR',
    description: `Durrah — طلب رقم ${order.id.slice(0, 8)}`,
    subtotal,
    discount,
    couponCode: coupon?.code ?? null,
    vat,
    total,
  };
});
