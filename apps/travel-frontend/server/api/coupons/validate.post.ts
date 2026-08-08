import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';
import { couponReasonMessage, priceCart } from '../../utils/checkout';

/**
 * POST /api/coupons/validate  { code }
 *
 * Tests a coupon code for the signed-in shopper and, when it's usable, prices
 * her actual cart with it applied. Returning real money (not just a
 * percentage) means the checkout summary shows exactly what will be charged —
 * the same figures the order-creation endpoints recompute a moment later.
 *
 * A rejection is a 200 with `{ valid: false, reason }` rather than an error
 * status: an unusable code is an ordinary outcome of the shopper pressing
 * "تحقق", not a failure of the request. The `coupons` table itself is never
 * exposed — validation runs through the SECURITY DEFINER `validate_coupon`
 * RPC, so codes can't be enumerated from the browser.
 */
export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  const uid =
    (user as { id?: string; sub?: string } | null)?.id ??
    (user as { sub?: string } | null)?.sub;
  if (!uid) {
    throw createError({ statusCode: 401, statusMessage: 'الرجاء تسجيل الدخول لاستخدام الكوبون.' });
  }

  const body = await readBody<{ code?: unknown }>(event).catch(() => ({}));
  const code = (typeof body?.code === 'string' ? body.code : '').trim().toUpperCase();
  if (!code) {
    return { valid: false, reason: 'not_found', message: couponReasonMessage('not_found') };
  }

  const client = await serverSupabaseClient<Database>(event);

  const { data, error } = await client.rpc('validate_coupon', { p_code: code });
  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row || row.valid !== true) {
    const reason = row?.reason ?? 'not_found';
    return { valid: false, reason, message: couponReasonMessage(reason) };
  }

  // Valid — price the real cart so the summary can show the exact figures.
  const { subtotal, discount, vat, total, vatRate } = await priceCart(client, uid, code);

  return {
    valid: true,
    code,
    discountPercent: Number(row.discount_percent ?? 0),
    subtotal,
    discount,
    vat,
    total,
    vatRate,
  };
});
