/**
 * Moyasar server helpers. The secret key is server-only (runtimeConfig) and is
 * used to read a payment back from the Moyasar API so we can verify a payment
 * before marking an order as paid — the client is never trusted for this.
 *
 * Docs: https://docs.moyasar.com/api/payments/01-retrieve-payment
 */

const MOYASAR_API = 'https://api.moyasar.com/v1';

/** Moyasar payment statuses we care about. */
export type MoyasarStatus =
  | 'initiated'
  | 'paid'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'voided';

export interface MoyasarPayment {
  id: string;
  status: MoyasarStatus;
  amount: number; // in the smallest currency unit (halalas for SAR)
  fee?: number;
  currency: string;
  description?: string | null;
  amount_format?: string;
  invoice_id?: string | null;
  ip?: string | null;
  callback_url?: string | null;
  created_at?: string;
  updated_at?: string;
  metadata?: Record<string, unknown> | null;
  source?: Record<string, unknown> | null;
}

/** Basic-auth header: secret key as the username, empty password. */
function authHeader(secretKey: string): string {
  const token = Buffer.from(`${secretKey}:`).toString('base64');
  return `Basic ${token}`;
}

/**
 * Fetch a single payment from Moyasar by id. Throws if the key is missing or
 * the API responds with an error status.
 */
export async function fetchMoyasarPayment(
  id: string,
  secretKey: string
): Promise<MoyasarPayment> {
  if (!secretKey || secretKey.includes('REPLACE_ME')) {
    throw new Error('MOYASAR_SECRET_KEY is not configured on the server');
  }

  const res = await fetch(`${MOYASAR_API}/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: authHeader(secretKey), Accept: 'application/json' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Moyasar API ${res.status}: ${text.slice(0, 300)}`);
  }

  return (await res.json()) as MoyasarPayment;
}

/** Read the order_id we stamped into the payment metadata at creation time. */
export function orderIdFromPayment(payment: MoyasarPayment): string | null {
  const meta = payment.metadata ?? {};
  const raw = (meta.order_id ?? meta.orderId) as unknown;
  return typeof raw === 'string' && raw.length > 0 ? raw : null;
}
