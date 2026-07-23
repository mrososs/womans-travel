/**
 * Tabby server helpers — "Pay in 4" (installments) custom integration.
 *
 * The secret key is server-only and is used to (1) create a Checkout Session,
 * (2) read a payment back to verify it, and (3) capture it. The client is never
 * trusted for confirmation — exactly like the Moyasar flow (see ./moyasar.ts).
 *
 * Secrets live in Supabase Vault (read via the locked-down public.get_secret()
 * RPC under the service role) and are NOT baked into env/source, mirroring how
 * the moyasar-webhook Edge Function reads its keys. A plain env var
 * (TABBY_SECRET_KEY) is honoured as a dev fallback when the service-role key is
 * not configured locally.
 *
 * Docs: https://docs.tabby.ai/pay-in-4-custom-integration
 *       https://docs.tabby.ai/api-reference/checkout/create-a-session
 */
import type { H3Event } from 'h3';
import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/database.types';

export const TABBY_API = 'https://api.tabby.ai/api/v2';

/** Tabby payment lifecycle statuses we care about. */
export type TabbyPaymentStatus =
  | 'CREATED'
  | 'AUTHORIZED'
  | 'CLOSED'
  | 'REJECTED'
  | 'EXPIRED';

export interface TabbyPayment {
  id: string;
  status: TabbyPaymentStatus;
  amount: string; // decimal string, e.g. "339.00"
  currency: string;
  is_test?: boolean;
  order?: { reference_id?: string | null } | null;
  captures?: Array<{ id: string; amount: string }> | null;
  meta?: Record<string, unknown> | null;
}

/** Response of POST /checkout (create session). */
export interface TabbyCheckoutSession {
  id: string;
  status: string; // 'created' | 'rejected' | 'expired' | 'approved'
  configuration?: {
    available_products?: {
      installments?: Array<{ web_url?: string }>;
    };
    products?: {
      installments?: { is_available?: boolean; rejection_reason?: string | null };
    };
  } | null;
  payment?: TabbyPayment | null;
  warnings?: unknown;
}

/** Bearer auth header — the secret key authenticates Checkout + Payments APIs. */
function authHeader(secretKey: string): string {
  return `Bearer ${secretKey}`;
}

/** Format a numeric SAR amount as the 2-decimal string Tabby expects. */
export function toTabbyAmount(amount: number): string {
  return (Math.round(amount * 100) / 100).toFixed(2);
}

/**
 * Read a Vault secret (server-only) via the service-role client + get_secret
 * RPC. Returns null when the service-role key is not configured (dev) so the
 * caller can fall back to an env var.
 */
async function readVaultSecret(event: H3Event, name: string): Promise<string | null> {
  let admin;
  try {
    admin = serverSupabaseServiceRole<Database>(event);
  } catch {
    return null; // SUPABASE_SERVICE_KEY not set
  }
  const { data, error } = await admin.rpc('get_secret', { p_name: name });
  if (error) return null;
  const val = (data as string | null) ?? null;
  return val && val.length > 0 ? val : null;
}

/** Tabby secret key: Vault first, then TABBY_SECRET_KEY env fallback. */
export async function getTabbySecretKey(event: H3Event): Promise<string> {
  const fromVault = await readVaultSecret(event, 'tabby_secret_key');
  const key = fromVault || process.env.TABBY_SECRET_KEY || '';
  if (!key || key.includes('REPLACE_ME')) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Tabby secret key is not configured (Vault: tabby_secret_key)',
    });
  }
  return key;
}

/** Tabby webhook shared secret used to authenticate inbound webhook calls. */
export async function getTabbyWebhookSecret(event: H3Event): Promise<string | null> {
  const fromVault = await readVaultSecret(event, 'tabby_webhook_secret');
  return fromVault || process.env.TABBY_WEBHOOK_SECRET || null;
}

/** True when the key is a sandbox key (drives test-buyer substitution). */
export function isTabbyTestKey(secretKey: string): boolean {
  return secretKey.startsWith('sk_test');
}

export interface CreateSessionInput {
  amount: number; // SAR
  currency: string; // 'SAR'
  description: string;
  orderReferenceId: string; // our order id — echoed back on retrieve
  lang: 'ar' | 'en';
  merchantCode: string;
  buyer: { name: string; email: string; phone: string };
  items: Array<{ reference_id: string; title: string; quantity: number; unit_price: number }>;
  merchantUrls: { success: string; cancel: string; failure: string };
}

/**
 * Create a Tabby Checkout Session. Tabby pre-scores the buyer synchronously:
 * on approval the response carries a hosted-checkout web_url; on rejection
 * `configuration.products.installments.is_available` is false with a reason.
 */
export async function createTabbyCheckout(
  input: CreateSessionInput,
  secretKey: string
): Promise<TabbyCheckoutSession> {
  const body = {
    payment: {
      amount: toTabbyAmount(input.amount),
      currency: input.currency,
      description: input.description,
      buyer: {
        name: input.buyer.name,
        email: input.buyer.email,
        phone: input.buyer.phone,
      },
      order: {
        reference_id: input.orderReferenceId,
        items: input.items.map((i) => ({
          reference_id: i.reference_id,
          title: i.title,
          quantity: i.quantity,
          unit_price: toTabbyAmount(i.unit_price),
          category: 'travel',
        })),
      },
      buyer_history: {
        registered_since: new Date().toISOString(),
        loyalty_level: 0,
      },
    },
    lang: input.lang,
    merchant_code: input.merchantCode,
    merchant_urls: input.merchantUrls,
  };

  const res = await fetch(`${TABBY_API}/checkout`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(secretKey),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw createError({
      statusCode: 502,
      statusMessage: `Tabby checkout ${res.status}: ${text.slice(0, 400)}`,
    });
  }

  return (await res.json()) as TabbyCheckoutSession;
}

/** Pull the hosted-checkout redirect URL out of a created session, if any. */
export function webUrlFromSession(session: TabbyCheckoutSession): string | null {
  const url = session.configuration?.available_products?.installments?.[0]?.web_url;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

/** Fetch a single payment from Tabby by id (authoritative status/amount). */
export async function fetchTabbyPayment(
  id: string,
  secretKey: string
): Promise<TabbyPayment> {
  const res = await fetch(`${TABBY_API}/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: authHeader(secretKey), Accept: 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw createError({
      statusCode: 502,
      statusMessage: `Tabby retrieve ${res.status}: ${text.slice(0, 300)}`,
    });
  }
  return (await res.json()) as TabbyPayment;
}

/**
 * Capture an authorized payment (settlement). For a service booking we capture
 * the full amount immediately on authorization. Idempotent-ish: capturing an
 * already-closed payment returns a 4xx which the caller treats as non-fatal.
 */
export async function captureTabbyPayment(
  id: string,
  amount: number,
  secretKey: string
): Promise<{ ok: boolean; status: number }> {
  const res = await fetch(`${TABBY_API}/payments/${encodeURIComponent(id)}/captures`, {
    method: 'POST',
    headers: {
      Authorization: authHeader(secretKey),
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ amount: toTabbyAmount(amount) }),
  });
  return { ok: res.ok, status: res.status };
}

/** Read the order id we stamped into order.reference_id at creation time. */
export function orderIdFromPayment(payment: TabbyPayment): string | null {
  const raw = payment.order?.reference_id;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}
