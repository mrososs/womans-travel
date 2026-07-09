import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';
import { normalizeTraveler, priceCart, type TravelerInput } from '../../utils/checkout';

/**
 * POST /api/orders/bank-transfer  { traveler, transferReference }
 *
 * Creates a bank-transfer order for the signed-in shopper. Unlike the Moyasar
 * flow (confirmed by the gateway), a manual transfer is created as
 * `payment_status: 'pending'` and stays that way until an admin verifies the
 * money arrived and approves it from the dashboard.
 *
 * The amount is recomputed server-side from the DB cart (client never trusted),
 * the traveler manifest is validated + snapshotted, and the customer-entered
 * transfer reference + buyer email are stored on the order. The cart is cleared
 * once the order is recorded.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const uid = (user as { id?: string; sub?: string } | null)?.id ?? (user as { sub?: string } | null)?.sub;
  if (!uid) {
    throw createError({ statusCode: 401, statusMessage: 'الرجاء تسجيل الدخول لإتمام الحجز.' });
  }
  const email = (user as { email?: string } | null)?.email ?? null;

  const body = await readBody<{ traveler?: TravelerInput; transferReference?: unknown }>(event).catch(() => ({}));
  const traveler = normalizeTraveler(body?.traveler);

  const transferReference = (typeof body?.transferReference === 'string' ? body.transferReference : '').trim();
  if (transferReference.length < 4) {
    throw createError({ statusCode: 400, statusMessage: 'الرجاء إدخال رقم عملية التحويل البنكي.' });
  }

  const client = await serverSupabaseClient<Database>(event);

  // 1) Read the authoritative cart + recompute totals server-side.
  const { lines, subtotal, total } = await priceCart(client, uid);

  // 2) Create the pending bank-transfer order.
  const { data: order, error: orderError } = await client
    .from('orders')
    .insert({
      user_id: uid,
      status: 'pending',
      currency: 'SAR',
      subtotal,
      total,
      payment_provider: 'bank_transfer',
      payment_method: 'bank_transfer',
      payment_status: 'pending',
      transfer_reference: transferReference,
      customer_email: email,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    throw createError({ statusCode: 500, statusMessage: orderError?.message ?? 'Could not create order' });
  }

  // 2b) Snapshot the traveler manifest (fail-soft, mirrors the Moyasar flow).
  const { error: travelerError } = await client
    .from('orders')
    .update({ traveler_info: traveler })
    .eq('id', order.id);
  if (travelerError) {
    console.warn('[orders/bank-transfer] could not persist traveler_info:', travelerError.message);
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

  // 4) The order now owns the items — clear the shopper's cart.
  await client.from('cart_items').delete().eq('user_id', uid);

  return { orderId: order.id, total, currency: 'SAR' };
});
