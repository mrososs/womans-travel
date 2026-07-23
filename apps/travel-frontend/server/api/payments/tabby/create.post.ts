import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';
import { normalizeTraveler, priceCart, type TravelerInput } from '../../../utils/checkout';
import {
  createTabbyCheckout,
  getTabbySecretKey,
  isTabbyTestKey,
  webUrlFromSession,
} from '../../../utils/tabby';

/**
 * POST /api/payments/tabby/create
 *
 * Tabby "Pay in 4" counterpart of /api/payments/create. Creates a `pending`
 * order (+ order_items) from the shopper's cart with the amount recomputed
 * **server-side**, then opens a Tabby Checkout Session and returns the hosted
 * checkout `webUrl` for the browser to redirect to. Payment is only confirmed
 * later, server-side, by /api/payments/tabby/callback (+ webhook) once Tabby
 * reports the charge AUTHORIZED.
 *
 * Tabby pre-scores the buyer at session creation: if installments are not
 * available for this buyer we return `{ rejected: true }` and the UI falls back
 * to another method — we do NOT leave a stale pending order blocking checkout.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const uid =
    (user as { id?: string; sub?: string } | null)?.id ??
    (user as { sub?: string } | null)?.sub;
  if (!uid) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in to check out' });
  }
  const email = (user as { email?: string } | null)?.email ?? null;

  const body = await readBody<{ traveler?: TravelerInput; lang?: string }>(event).catch(() => ({}));
  const traveler = normalizeTraveler(body?.traveler);
  const lang: 'ar' | 'en' = body?.lang === 'en' ? 'en' : 'ar';

  const client = await serverSupabaseClient<Database>(event);

  // 1) Authoritative cart + server-recomputed totals.
  const { lines, subtotal, vat, total } = await priceCart(client, uid);

  // 2) Read the secret key up front so we can fail fast before creating an order.
  const secretKey = await getTabbySecretKey(event);
  const testMode = isTabbyTestKey(secretKey);

  // 3) Resolve buyer details for Tabby scoring. In sandbox we MUST use Tabby's
  // test buyer (test keys reject real credentials); in live mode we use the
  // shopper's own profile phone + account email.
  const { data: profile } = await client
    .from('profiles')
    .select('phone, full_name')
    .eq('id', uid)
    .maybeSingle();

  const buyerName = traveler.fullNameEn || traveler.fullName || profile?.full_name || 'Customer';
  const buyer = testMode
    ? { name: buyerName, email: 'otp.success@tabby.ai', phone: '+966500000001' }
    : {
        name: buyerName,
        email: email || 'customer@example.com',
        phone: profile?.phone || '',
      };

  if (!testMode && !buyer.phone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'رقم الجوال مطلوب للدفع عبر تابي — يُرجى إضافته إلى ملفكِ الشخصي.',
    });
  }

  // 4) Merchant config (public key not needed here; merchant_code is).
  const { data: settings } = await client
    .from('payment_settings')
    .select('tabby_enabled, tabby_merchant_code')
    .eq('id', 1)
    .maybeSingle();

  if (settings && settings.tabby_enabled === false) {
    throw createError({ statusCode: 403, statusMessage: 'Tabby is not enabled' });
  }
  const merchantCode = settings?.tabby_merchant_code || process.env.TABBY_MERCHANT_CODE || 'goldenfuture';

  // 5) Create the pending order.
  const { data: order, error: orderError } = await client
    .from('orders')
    .insert({
      user_id: uid,
      status: 'pending',
      currency: 'SAR',
      subtotal,
      total,
      payment_provider: 'tabby',
      payment_method: 'tabby',
      payment_status: 'pending',
      customer_email: email,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    throw createError({ statusCode: 500, statusMessage: orderError?.message ?? 'Could not create order' });
  }

  // 5b) Snapshot traveler manifest (fail-soft) + line items.
  await client.from('orders').update({ traveler_info: traveler }).eq('id', order.id);
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

  // 6) Open the Tabby Checkout Session.
  const origin = getRequestURL(event).origin;
  const callback = `${origin}/api/payments/tabby/callback`;
  const session = await createTabbyCheckout(
    {
      amount: total,
      currency: 'SAR',
      description: `Durrah — طلب رقم ${order.id.slice(0, 8)}`,
      orderReferenceId: order.id,
      lang,
      merchantCode,
      buyer,
      items: lines.map((l) => ({
        reference_id: `${l.item_type}:${l.item_id}`,
        title: l.title,
        quantity: l.quantity,
        unit_price: l.unit_price,
      })),
      merchantUrls: {
        success: `${callback}?status=success`,
        cancel: `${callback}?status=cancel`,
        failure: `${callback}?status=failure`,
      },
    },
    secretKey
  );

  const webUrl = webUrlFromSession(session);

  // 7) Buyer not eligible for installments → mark the order failed and tell the
  // client to offer another method. (No hosted URL is issued in this case.)
  if (session.status === 'rejected' || !webUrl) {
    await client
      .from('orders')
      .update({ status: 'failed', payment_status: 'rejected' })
      .eq('id', order.id);
    const reason = session.configuration?.products?.installments?.rejection_reason ?? 'not_available';
    return { rejected: true, reason, orderId: order.id };
  }

  // 8) Stamp the Tabby payment id on the order (idempotency + reconciliation).
  if (session.payment?.id) {
    await client.from('orders').update({ payment_ref: session.payment.id }).eq('id', order.id);
  }

  return {
    orderId: order.id,
    webUrl,
    amount: total,
    currency: 'SAR',
    subtotal,
    vat,
    total,
  };
});
