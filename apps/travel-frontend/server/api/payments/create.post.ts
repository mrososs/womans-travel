import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';

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

const VAT_RATE = 0.15;

// Demo fallback — kept in sync with the client summary in CheckoutPayment.vue.
const DEMO_ITEM = {
  item_type: 'trip',
  item_id: 'demo-wadi-ramsa',
  title: 'رحلة وادي الرمسا الحصرية',
  unit_price: 4800,
  quantity: 1,
};

type TravelerInput = {
  firstName?: unknown;
  fatherName?: unknown;
  grandfatherName?: unknown;
  familyName?: unknown;
  passportNumber?: unknown;
  passportIssueDate?: unknown;
  passportExpiryDate?: unknown;
  declaredAccurate?: unknown;
  pledgedCompliance?: unknown;
};

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

// Saudi validation rules — kept in sync with the client form
// (app/components/CheckoutTravelerForm.vue). Enforced here too so the checks
// can't be bypassed by calling the endpoint directly.
const AR_NAME = /^[ء-يـ\s]{2,}$/; // Arabic letters + tatweel + spaces
const SA_PASSPORT = /^[A-Za-z][0-9]{7,8}$/; // letter + 7–8 digits, e.g. A1234567

const bad = (statusMessage: string) => createError({ statusCode: 400, statusMessage });

/**
 * Validate + normalize the traveler details captured in the checkout stepper.
 * Returns the sanitized object to snapshot onto the order, or throws a 400 with
 * a shopper-facing (Arabic) message when a field is missing or malformed.
 */
function normalizeTraveler(raw: TravelerInput | undefined) {
  if (!raw || typeof raw !== 'object') {
    throw bad('بيانات المسافرة مطلوبة قبل الدفع.');
  }

  const firstName = str(raw.firstName);
  const fatherName = str(raw.fatherName);
  const grandfatherName = str(raw.grandfatherName);
  const familyName = str(raw.familyName);
  const passportNumber = str(raw.passportNumber).toUpperCase();
  const passportIssueDate = str(raw.passportIssueDate);
  const passportExpiryDate = str(raw.passportExpiryDate);

  const nameParts: [string, string][] = [
    [firstName, 'الاسم الأول'],
    [fatherName, 'اسم الأب'],
    [grandfatherName, 'اسم الجد'],
    [familyName, 'اسم العائلة'],
  ];
  for (const [value, label] of nameParts) {
    if (!value) throw bad(`${label} مطلوب.`);
    if (!AR_NAME.test(value)) throw bad(`${label} يجب أن يكون بالأحرف العربية فقط.`);
  }

  if (!passportNumber) throw bad('رقم جواز السفر مطلوب.');
  if (!SA_PASSPORT.test(passportNumber)) {
    throw bad('رقم جواز السفر غير صحيح — حرف يليه 7 أو 8 أرقام (مثال: A1234567).');
  }

  if (!passportExpiryDate) throw bad('تاريخ انتهاء الجواز مطلوب.');
  const todayISO = new Date().toISOString().slice(0, 10);
  const minExpiry = new Date();
  minExpiry.setMonth(minExpiry.getMonth() + 6);
  const minExpiryISO = minExpiry.toISOString().slice(0, 10);
  if (passportExpiryDate <= todayISO) throw bad('تاريخ انتهاء الجواز يجب أن يكون في المستقبل.');
  if (passportExpiryDate < minExpiryISO) {
    throw bad('يجب أن يكون الجواز صالحًا 6 أشهر على الأقل من اليوم.');
  }
  if (passportIssueDate) {
    if (passportIssueDate > todayISO) throw bad('تاريخ الإصدار لا يمكن أن يكون في المستقبل.');
    if (passportIssueDate >= passportExpiryDate) {
      throw bad('تاريخ الإصدار يجب أن يسبق تاريخ الانتهاء.');
    }
  }

  if (raw.declaredAccurate !== true || raw.pledgedCompliance !== true) {
    throw bad('الرجاء الإقرار بصحة المعلومات والتعهّد بالالتزام قبل المتابعة.');
  }

  return {
    firstName,
    fatherName,
    grandfatherName,
    familyName,
    fullName: [firstName, fatherName, grandfatherName, familyName].join(' '),
    passportNumber,
    passportIssueDate: passportIssueDate || null,
    passportExpiryDate,
    declaredAccurate: true,
    pledgedCompliance: true,
    capturedAt: new Date().toISOString(),
  };
}

export default defineEventHandler(async (event) => {
  const user = await serverSupabaseUser(event);
  // NOTE: serverSupabaseUser returns verified JWT *claims* here, where the user
  // id is `sub` (not `id`). Support both shapes so this is version-proof.
  const uid = (user as { id?: string; sub?: string } | null)?.id ?? (user as { sub?: string } | null)?.sub;
  if (!uid) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in to check out' });
  }

  // Traveler details captured in the checkout stepper (required before payment).
  const body = await readBody<{ traveler?: TravelerInput }>(event).catch(() => ({}));
  const traveler = normalizeTraveler(body?.traveler);

  const client = await serverSupabaseClient<Database>(event);

  // 1) Read the authoritative cart from the DB (owner-scoped by RLS).
  const { data: cart, error: cartError } = await client
    .from('cart_items')
    .select('item_type, item_id, title, unit_price, quantity')
    .eq('user_id', uid);

  if (cartError) {
    throw createError({ statusCode: 500, statusMessage: cartError.message });
  }

  const lines = (cart && cart.length ? cart : [DEMO_ITEM]).map((i) => {
    const unit = Number(i.unit_price ?? 0);
    const qty = Math.max(1, Number(i.quantity ?? 1));
    return {
      item_type: i.item_type,
      item_id: i.item_id,
      title: i.title ?? i.item_id,
      unit_price: unit,
      quantity: qty,
      line_total: Math.round(unit * qty * 100) / 100,
    };
  });

  const subtotal = Math.round(lines.reduce((s, l) => s + l.line_total, 0) * 100) / 100;
  if (subtotal <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Cart total must be greater than zero' });
  }
  const vat = Math.round(subtotal * VAT_RATE * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

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
    })
    .select('id')
    .single();

  if (orderError || !order) {
    throw createError({ statusCode: 500, statusMessage: orderError?.message ?? 'Could not create order' });
  }

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
    vat,
    total,
  };
});
