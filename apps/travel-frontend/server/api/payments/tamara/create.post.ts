import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';
import {
  isDomesticCart,
  normalizeTraveler,
  priceCart,
  reserveCoupon,
  type TravelerInput,
} from '../../../utils/checkout';
import {
  createTamaraCheckout,
  getTamaraApiToken,
  tamaraBase,
} from '../../../utils/tamara';

/**
 * POST /api/payments/tamara/create
 *
 * Tamara counterpart of the Tabby/Moyasar create endpoints. Creates a `pending`
 * order (+ order_items) with the amount recomputed **server-side**, opens a
 * Tamara checkout session, and returns the hosted `checkoutUrl` for the browser
 * to redirect to. Confirmation happens later, server-side, via the callback +
 * webhook (authorise → capture).
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const uid =
    (user as { id?: string; sub?: string } | null)?.id ??
    (user as { sub?: string } | null)?.sub;
  if (!uid) throw createError({ statusCode: 401, statusMessage: 'Sign in to check out' });
  const email = (user as { email?: string } | null)?.email ?? null;

  const body = await readBody<{ traveler?: TravelerInput; lang?: string; couponCode?: string }>(
    event
  ).catch(() => ({}));
  const lang: 'ar' | 'en' = body?.lang === 'en' ? 'en' : 'ar';

  const client = await serverSupabaseClient<Database>(event);
  const { lines, subtotal, coupon, discount, vat, total } = await priceCart(
    client,
    uid,
    body?.couponCode
  );

  // Domestic carts skip the passport fields for a national ID/iqama.
  const domestic = await isDomesticCart(client, lines);
  const traveler = normalizeTraveler(body?.traveler, domestic);

  const { data: settings } = await client
    .from('payment_settings')
    .select('tamara_enabled, tamara_test_mode')
    .eq('id', 1)
    .maybeSingle();
  if (settings && settings.tamara_enabled === false) {
    throw createError({ statusCode: 403, statusMessage: 'Tamara is not enabled' });
  }
  const testMode = settings?.tamara_test_mode !== false;
  const token = await getTamaraApiToken(event);

  const { data: profile } = await client
    .from('profiles')
    .select('phone, full_name')
    .eq('id', uid)
    .maybeSingle();

  // Tamara requires first + last name; split the Latin four-part name.
  const nameParts = (traveler.fullNameEn || traveler.fullName || profile?.full_name || 'Durrah Customer')
    .split(/\s+/)
    .filter(Boolean);
  const firstName = nameParts[0] || 'Durrah';
  const lastName = nameParts.slice(1).join(' ') || 'Customer';
  // The checkout manifest always carries a validated E.164 mobile; the profile
  // is only a fallback for a manifest that predates that field.
  const phone = traveler.phone || profile?.phone || (testMode ? '+966500000000' : '');
  if (!phone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'رقم الجوال مطلوب للدفع عبر تمارا — يُرجى إدخاله في بيانات التواصل.',
    });
  }

  // Create the pending order.
  const { data: order, error: orderError } = await client
    .from('orders')
    .insert({
      user_id: uid,
      status: 'pending',
      currency: 'SAR',
      subtotal,
      total,
      payment_provider: 'tamara',
      payment_method: 'tamara',
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

  // Claim the shopper's single redemption. A Tamara rejection below marks the
  // order 'rejected', which releases it again.
  if (coupon) await reserveCoupon(client, coupon, order.id, discount);

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
  if (itemsError) throw createError({ statusCode: 500, statusMessage: itemsError.message });

  const origin = getRequestURL(event).origin;
  const callback = `${origin}/api/payments/tamara/callback`;
  const session = await createTamaraCheckout(tamaraBase(testMode), token, {
    amount: total,
    currency: 'SAR',
    description: `Durrah — طلب رقم ${order.id.slice(0, 8)}`,
    orderReferenceId: order.id,
    countryCode: 'SA',
    locale: lang === 'en' ? 'en_US' : 'ar_SA',
    consumer: { firstName, lastName, phone, email: email || 'customer@example.com' },
    items: lines.map((l) => ({
      name: l.title,
      sku: `${l.item_type}:${l.item_id}`,
      quantity: l.quantity,
      unitPrice: l.unit_price,
      referenceId: `${l.item_type}:${l.item_id}`,
    })),
    taxAmount: vat,
    // Tamara enforces total_amount === sum(items) + tax + shipping − discount,
    // so a coupon MUST be declared here or the session is rejected outright.
    discount: discount > 0 ? { amount: discount, name: coupon?.code ?? 'DISCOUNT' } : undefined,
    merchantUrl: {
      success: `${callback}?status=success`,
      failure: `${callback}?status=failure`,
      cancel: `${callback}?status=cancel`,
      notification: `${origin}/api/payments/tamara/webhook`,
    },
  });

  if (!session.ok || !session.checkoutUrl || !session.orderId) {
    await client
      .from('orders')
      .update({ status: 'failed', payment_status: 'rejected' })
      .eq('id', order.id);
    return { rejected: true, orderId: order.id };
  }

  // Stamp Tamara's order_id as the payment_ref for reconciliation.
  await client.from('orders').update({ payment_ref: session.orderId }).eq('id', order.id);

  return {
    orderId: order.id,
    checkoutUrl: session.checkoutUrl,
    amount: total,
    currency: 'SAR',
    subtotal,
    discount,
    couponCode: coupon?.code ?? null,
    vat,
    total,
  };
});
