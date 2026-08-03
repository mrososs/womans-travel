import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';

/**
 * Shared checkout helpers used by both payment flows:
 *  - /api/payments/create        (Moyasar hosted-form flow)
 *  - /api/orders/bank-transfer   (manual bank-transfer flow)
 *
 * Keeping the traveler validation and cart pricing here means the two flows
 * charge the exact same amount and enforce the exact same manifest rules — the
 * client is never trusted for either.
 */

// Fallback VAT rate used only when the tax_settings row can't be read.
export const DEFAULT_VAT_RATE = 0.15;

/**
 * Read the admin-configured VAT rate (as a fraction, e.g. 0.15) from the
 * singleton tax_settings row. Falls back to the default 15% on any read error
 * so checkout never breaks if the row/table is missing.
 */
export async function getVatRate(client: SupabaseClient<Database>): Promise<number> {
  const { data, error } = await client
    .from('tax_settings')
    .select('vat_percent')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data || data.vat_percent == null) return DEFAULT_VAT_RATE;
  const pct = Number(data.vat_percent);
  if (!Number.isFinite(pct) || pct < 0 || pct > 100) return DEFAULT_VAT_RATE;
  return pct / 100;
}

// Demo fallback — kept in sync with the client summary in CheckoutPayment.vue.
export const DEMO_ITEM = {
  item_type: 'trip',
  item_id: 'demo-wadi-ramsa',
  title: 'رحلة وادي الرمسا الحصرية',
  unit_price: 4800,
  quantity: 1,
};

export type TravelerInput = {
  fullNameAr?: unknown;
  fullNameEn?: unknown;
  passportNumber?: unknown;
  passportIssueDate?: unknown;
  passportExpiryDate?: unknown;
  declaredAccurate?: unknown;
  pledgedCompliance?: unknown;
  pledgedNoCompanions?: unknown;
};

const str = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '');

// Saudi validation rules — kept in sync with the client form
// (app/components/CheckoutTravelerForm.vue). Enforced here too so the checks
// can't be bypassed by calling the endpoint directly.
const AR_FULL_NAME = /^[ء-يـ\s]{2,}$/; // Arabic letters + tatweel + spaces
const EN_FULL_NAME = /^[A-Za-z][A-Za-z\s'.-]*$/; // Latin letters + spaces
const countParts = (v: string) => v.split(/\s+/).filter(Boolean).length; // ≥ 4 = full name
const SA_PASSPORT = /^[A-Za-z][0-9]{7,8}$/; // letter + 7–8 digits, e.g. A1234567

const bad = (statusMessage: string) => createError({ statusCode: 400, statusMessage });

/**
 * Validate + normalize the traveler details captured in the checkout stepper.
 * Returns the sanitized object to snapshot onto the order, or throws a 400 with
 * a shopper-facing (Arabic) message when a field is missing or malformed.
 */
export function normalizeTraveler(raw: TravelerInput | undefined) {
  if (!raw || typeof raw !== 'object') {
    throw bad('بيانات المسافرة مطلوبة قبل الدفع.');
  }

  const fullNameAr = str(raw.fullNameAr);
  const fullNameEn = str(raw.fullNameEn);
  const passportNumber = str(raw.passportNumber).toUpperCase();
  const passportIssueDate = str(raw.passportIssueDate);
  const passportExpiryDate = str(raw.passportExpiryDate);

  if (!fullNameAr) throw bad('الاسم الرباعي بالعربية مطلوب.');
  if (!AR_FULL_NAME.test(fullNameAr)) throw bad('الاسم يجب أن يكون بالأحرف العربية فقط.');
  if (countParts(fullNameAr) < 4) throw bad('يُرجى إدخال الاسم رباعيًا كما في جواز السفر.');

  if (!fullNameEn) throw bad('الاسم الرباعي بالإنجليزية مطلوب.');
  if (!EN_FULL_NAME.test(fullNameEn)) throw bad('الاسم يجب أن يكون بالأحرف الإنجليزية فقط.');
  if (countParts(fullNameEn) < 4) throw bad('يُرجى إدخال الاسم رباعيًا كما في جواز السفر.');

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

  if (
    raw.declaredAccurate !== true ||
    raw.pledgedCompliance !== true ||
    raw.pledgedNoCompanions !== true
  ) {
    throw bad('الرجاء الموافقة على جميع بنود الإقرار والتعهّد قبل المتابعة.');
  }

  return {
    fullNameAr,
    fullNameEn,
    fullName: fullNameAr,
    passportNumber,
    passportIssueDate: passportIssueDate || null,
    passportExpiryDate,
    declaredAccurate: true,
    pledgedCompliance: true,
    pledgedNoCompanions: true,
    capturedAt: new Date().toISOString(),
  };
}

export interface PricedLine {
  item_type: string;
  item_id: string;
  title: string;
  unit_price: number;
  quantity: number;
  line_total: number;
}

/**
 * Read the shopper's authoritative cart from the DB (owner-scoped by RLS) and
 * recompute the totals server-side. Falls back to a single demo trip when the
 * cart is empty so the flow stays testable. Throws on read error / empty total.
 */
export async function priceCart(client: SupabaseClient<Database>, uid: string) {
  const { data: cart, error: cartError } = await client
    .from('cart_items')
    .select('item_type, item_id, title, unit_price, quantity')
    .eq('user_id', uid);

  if (cartError) {
    throw createError({ statusCode: 500, statusMessage: cartError.message });
  }

  const lines: PricedLine[] = (cart && cart.length ? cart : [DEMO_ITEM]).map((i) => {
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
  const vatRate = await getVatRate(client);
  const vat = Math.round(subtotal * vatRate * 100) / 100;
  const total = Math.round((subtotal + vat) * 100) / 100;

  return { lines, subtotal, vat, total, vatRate };
}

export interface DepositInfo {
  /** True only when every cart line's item carries a deposit_amount. */
  eligible: boolean;
  /** Sum of each line's deposit_amount × quantity. 0 when not eligible. */
  depositTotal: number;
}

/**
 * Whether the priced cart can be settled with a deposit, and the deposit
 * total to charge instead of the full amount. Reads `deposit_amount` off the
 * `trips` / `packages` rows behind each cart line (never trusts the client),
 * so an admin who hasn't set a deposit on an item simply makes the whole
 * cart ineligible — there's no partial-deposit cart today.
 */
export async function priceDeposit(client: SupabaseClient<Database>, lines: PricedLine[]): Promise<DepositInfo> {
  if (!lines.length) return { eligible: false, depositTotal: 0 };

  const tripIds = [...new Set(lines.filter((l) => l.item_type === 'trip').map((l) => l.item_id))];
  const packageIds = [...new Set(lines.filter((l) => l.item_type === 'package').map((l) => l.item_id))];

  const depositByKey: Record<string, number> = {};
  if (tripIds.length) {
    const { data } = await client.from('trips').select('id, deposit_amount').in('id', tripIds);
    for (const t of data ?? []) if (t.deposit_amount != null) depositByKey[`trip:${t.id}`] = Number(t.deposit_amount);
  }
  if (packageIds.length) {
    const { data } = await client.from('packages').select('id, deposit_amount').in('id', packageIds);
    for (const p of data ?? []) if (p.deposit_amount != null) depositByKey[`package:${p.id}`] = Number(p.deposit_amount);
  }

  let depositTotal = 0;
  for (const l of lines) {
    const amount = depositByKey[`${l.item_type}:${l.item_id}`];
    if (amount == null) return { eligible: false, depositTotal: 0 };
    depositTotal += amount * l.quantity;
  }

  return { eligible: true, depositTotal: Math.round(depositTotal * 100) / 100 };
}
