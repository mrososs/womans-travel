/**
 * Tamara server helpers — BNPL ("Pay in 4" / installments) custom integration.
 *
 * Like the Tabby + Moyasar flows, all confirmation happens server-side and the
 * client is never trusted. The merchant API JWT + webhook notification token
 * live in Supabase Vault (read via the locked-down public.get_secret() RPC);
 * env vars are honoured only as a dev fallback.
 *
 * Flow:
 *   1. Pre-checkout eligibility  → POST /checkout/payment-options-pre-check
 *   2. Create checkout session   → POST /checkout  (returns checkout_url)
 *   3. On `approved` webhook/redirect → POST /orders/{id}/authorise
 *   4. Capture (settlement)      → POST /payments/capture
 * Success statuses: approved (intermediate) → authorised → fully_captured.
 *
 * Docs: https://docs.tamara.co/reference/createcheckoutsession
 *       https://docs.tamara.co/reference/checkpaymentoptionsavailability
 *       https://docs.tamara.co/docs/transaction-authorisation
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { H3Event } from 'h3';
import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/database.types';

export const TAMARA_SANDBOX = 'https://api-sandbox.tamara.co';
export const TAMARA_PRODUCTION = 'https://api.tamara.co';

export function tamaraBase(testMode: boolean): string {
  return testMode ? TAMARA_SANDBOX : TAMARA_PRODUCTION;
}

export interface TamaraMoney {
  amount: number;
  currency: string;
}

/** Order statuses Tamara reports. */
export type TamaraOrderStatus =
  | 'new'
  | 'approved'
  | 'authorised'
  | 'partially_captured'
  | 'fully_captured'
  | 'canceled'
  | 'declined'
  | 'expired'
  | 'refunded';

export interface TamaraOrder {
  order_id: string;
  order_reference_id?: string | null;
  status: TamaraOrderStatus | string;
  total_amount?: TamaraMoney;
}

/** Statuses that mean the buyer has committed and we can confirm the order. */
export function isTamaraPaidStatus(status: string): boolean {
  const s = String(status).toLowerCase();
  return s === 'authorised' || s === 'fully_captured' || s === 'partially_captured' || s === 'captured';
}

/** 2-decimal money object in the given currency. */
export function money(amount: number, currency = 'SAR'): TamaraMoney {
  return { amount: Math.round(amount * 100) / 100, currency };
}

function authHeader(token: string): string {
  return `Bearer ${token}`;
}

async function readVaultSecret(event: H3Event, name: string): Promise<string | null> {
  let admin;
  try {
    admin = serverSupabaseServiceRole<Database>(event);
  } catch {
    return null;
  }
  const { data, error } = await admin.rpc('get_secret', { p_name: name });
  if (error) return null;
  const val = (data as string | null) ?? null;
  return val && val.length > 0 ? val : null;
}

/** Tamara merchant API token: Vault first, then TAMARA_API_TOKEN env fallback. */
export async function getTamaraApiToken(event: H3Event): Promise<string> {
  const fromVault = await readVaultSecret(event, 'tamara_api_token');
  const token = fromVault || process.env.TAMARA_API_TOKEN || '';
  if (!token || token.includes('REPLACE_ME')) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Tamara API token is not configured (Vault: tamara_api_token)',
    });
  }
  return token;
}

/** Tamara webhook notification token (HS256 secret used to verify tamaraToken). */
export async function getTamaraNotificationToken(event: H3Event): Promise<string | null> {
  const fromVault = await readVaultSecret(event, 'tamara_notification_token');
  return fromVault || process.env.TAMARA_NOTIFICATION_TOKEN || null;
}

/**
 * Verify a `tamaraToken` (HS256 JWT signed with the notification token).
 * Tamara sends it as `Authorization: Bearer <token>` and/or a `tamaraToken`
 * query param. Returns true when the signature checks out.
 */
export function verifyTamaraToken(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [header, payload, signature] = parts;
  const expected = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function tamaraFetch<T>(
  base: string,
  token: string,
  path: string,
  init: { method: string; body?: unknown }
): Promise<{ ok: boolean; status: number; data: T | null; raw: string }> {
  const res = await fetch(`${base}${path}`, {
    method: init.method,
    headers: {
      Authorization: authHeader(token),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const raw = await res.text().catch(() => '');
  let data: T | null = null;
  try {
    data = raw ? (JSON.parse(raw) as T) : null;
  } catch {
    /* non-JSON body */
  }
  return { ok: res.ok, status: res.status, data, raw };
}

export interface PreCheckInput {
  country: string; // 'SA'
  orderValue: number;
  currency: string; // 'SAR'
  phone?: string;
  email?: string;
}

export interface PreCheckResult {
  eligible: boolean;
  raw?: unknown;
}

/**
 * Pre-checkout eligibility — MUST be called before creating the order so the
 * Tamara option is only shown/enabled when available for this buyer + basket.
 */
export async function preCheckEligibility(
  base: string,
  token: string,
  input: PreCheckInput
): Promise<PreCheckResult> {
  const { ok, data } = await tamaraFetch<{ has_available_payment_options?: boolean }>(
    base,
    token,
    '/checkout/payment-options-pre-check',
    {
      method: 'POST',
      body: {
        country: input.country,
        order_value: money(input.orderValue, input.currency),
        ...(input.phone ? { phone_number: input.phone } : {}),
        ...(input.email ? { email: input.email } : {}),
        is_vip: false,
      },
    }
  );
  return { eligible: Boolean(ok && data?.has_available_payment_options), raw: data };
}

export interface CreateCheckoutInput {
  amount: number;
  currency: string;
  description: string;
  orderReferenceId: string;
  countryCode: string; // 'SA'
  locale: string; // 'ar_SA' | 'en_US'
  consumer: { firstName: string; lastName: string; phone: string; email: string };
  items: Array<{ name: string; sku: string; quantity: number; unitPrice: number; referenceId: string }>;
  taxAmount?: number;
  /** Coupon discount. Required whenever `amount` is net of one — Tamara checks
   *  total_amount === sum(items) + tax + shipping − discount. */
  discount?: { amount: number; name: string };
  merchantUrl: { success: string; failure: string; cancel: string; notification: string };
}

export interface CreateCheckoutResult {
  orderId: string | null;
  checkoutUrl: string | null;
  status: string | null;
  raw: unknown;
  ok: boolean;
}

/** Create a Tamara checkout session; returns the hosted checkout_url. */
export async function createTamaraCheckout(
  base: string,
  token: string,
  input: CreateCheckoutInput
): Promise<CreateCheckoutResult> {
  const body = {
    total_amount: money(input.amount, input.currency),
    // Tamara requires tax_amount + shipping_amount present, and
    // total_amount === sum(items) + tax + shipping - discount. For a travel
    // service there is no shipping, so it's zero.
    tax_amount: money(input.taxAmount ?? 0, input.currency),
    shipping_amount: money(0, input.currency),
    ...(input.discount
      ? {
          discount: {
            name: input.discount.name,
            amount: money(input.discount.amount, input.currency),
          },
        }
      : {}),
    // REQUIRED — omitting payment_type makes Tamara respond 500. KSA offers
    // "Pay in 4" interest-free instalments (confirmed via pre-check).
    payment_type: 'PAY_BY_INSTALMENTS',
    instalments: 4,
    order_reference_id: input.orderReferenceId,
    description: input.description,
    country_code: input.countryCode,
    locale: input.locale,
    items: input.items.map((i) => ({
      name: i.name,
      type: 'Digital',
      sku: i.sku,
      quantity: i.quantity,
      unit_price: money(i.unitPrice, input.currency),
      total_amount: money(i.unitPrice * i.quantity, input.currency),
      reference_id: i.referenceId,
    })),
    consumer: {
      first_name: input.consumer.firstName,
      last_name: input.consumer.lastName,
      phone_number: input.consumer.phone,
      email: input.consumer.email,
    },
    merchant_url: input.merchantUrl,
  };

  const { ok, data } = await tamaraFetch<{
    order_id?: string;
    checkout_url?: string;
    status?: string;
  }>(base, token, '/checkout', { method: 'POST', body });

  return {
    ok,
    orderId: data?.order_id ?? null,
    checkoutUrl: data?.checkout_url ?? null,
    status: data?.status ?? null,
    raw: data,
  };
}

/** Fetch an order (authoritative status + amount). */
export async function getTamaraOrder(
  base: string,
  token: string,
  orderId: string
): Promise<TamaraOrder | null> {
  const { ok, data } = await tamaraFetch<TamaraOrder>(
    base,
    token,
    `/orders/${encodeURIComponent(orderId)}`,
    { method: 'GET' }
  );
  return ok ? data : null;
}

/** Authorise an approved order (required before capture). */
export async function authoriseTamaraOrder(
  base: string,
  token: string,
  orderId: string
): Promise<{ ok: boolean; status: number }> {
  const { ok, status } = await tamaraFetch(
    base,
    token,
    `/orders/${encodeURIComponent(orderId)}/authorise`,
    { method: 'POST' }
  );
  return { ok, status };
}

/** Capture (settle) the full amount of an authorised order. */
export async function captureTamaraOrder(
  base: string,
  token: string,
  orderId: string,
  amount: number,
  currency = 'SAR'
): Promise<{ ok: boolean; status: number }> {
  const { ok, status } = await tamaraFetch(base, token, '/payments/capture', {
    method: 'POST',
    body: { order_id: orderId, total_amount: money(amount, currency) },
  });
  return { ok, status };
}
