// Tamara webhook — Supabase Edge Function.
//
// Server-to-server order-status notifications for the Tamara BNPL flow. Runs as
// service_role (auto-injected), so it can confirm orders with no user session.
// Secrets live in Supabase Vault and are read via the locked-down get_secret()
// RPC. Authenticity is enforced by verifying the tamaraToken (HS256 JWT signed
// with the notification token) + an authoritative re-fetch of the order.
//
// Register this URL as the Tamara webhook (and/or as merchant_url.notification):
//   https://<project-ref>.functions.supabase.co/tamara-webhook
// Deployed with verify_jwt=false (Tamara sends no Supabase JWT).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SANDBOX = 'https://api-sandbox.tamara.co';
const PRODUCTION = 'https://api.tamara.co';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function base64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function verifyTamaraToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [h, p, s] = parts;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${p}`));
  return base64url(new Uint8Array(sig)) === s;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ ok: false, reason: 'method_not_allowed' }, 405);

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const getSecret = async (name: string): Promise<string | null> => {
    const { data, error } = await admin.rpc('get_secret', { p_name: name });
    if (error) throw new Error(`get_secret(${name}): ${error.message}`);
    return (data as string | null) ?? null;
  };

  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, reason: 'bad_json' }, 400);
  }

  // 1) Verify tamaraToken (Bearer header or ?tamaraToken=).
  const notifToken = await getSecret('tamara_notification_token');
  if (notifToken) {
    const url = new URL(req.url);
    const provided =
      (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '') ||
      (url.searchParams.get('tamaraToken') ?? '');
    if (!provided || !(await verifyTamaraToken(provided, notifToken))) {
      return json({ ok: false, reason: 'invalid_token' }, 401);
    }
  }

  const tamaraOrderId: string | undefined = body?.order_id;
  if (!tamaraOrderId) return json({ ok: false, reason: 'missing_order' }, 400);

  const apiToken = await getSecret('tamara_api_token');
  if (!apiToken) return json({ ok: false, reason: 'no_api_token' }, 500);

  const { data: settings } = await admin
    .from('payment_settings')
    .select('tamara_test_mode')
    .eq('id', 1)
    .maybeSingle();
  const base = settings?.tamara_test_mode === false ? PRODUCTION : SANDBOX;

  const authHeaders = { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' };

  // 2) Re-fetch the authoritative order.
  const oRes = await fetch(`${base}/orders/${encodeURIComponent(tamaraOrderId)}`, { headers: authHeaders });
  if (!oRes.ok) return json({ ok: false, reason: 'verify_failed', status: oRes.status });
  const tOrder = await oRes.json();

  const orderId: string | undefined = tOrder?.order_reference_id ?? undefined;
  if (!orderId) return json({ ok: false, reason: 'missing_order_ref' });

  const { data: order } = await admin
    .from('orders')
    .select('id, total, status, user_id')
    .eq('id', orderId)
    .maybeSingle();
  if (!order) return json({ ok: false, reason: 'order_not_found' });
  if (order.status === 'paid') return json({ ok: true, alreadyPaid: true });

  const expected = Math.round(Number(order.total) * 100) / 100;
  const amountOk = tOrder?.total_amount?.amount != null && Number(tOrder.total_amount.amount) === expected;

  let statusNow = String(tOrder.status).toLowerCase();

  // approved → authorise
  if (statusNow === 'approved') {
    const a = await fetch(`${base}/orders/${encodeURIComponent(tamaraOrderId)}/authorise`, {
      method: 'POST',
      headers: authHeaders,
    });
    if (a.ok) statusNow = 'authorised';
  }

  const committed =
    statusNow === 'approved' ||
    ['authorised', 'fully_captured', 'partially_captured', 'captured'].includes(statusNow);
  const paid = committed && amountOk;

  // authorised → capture (settlement)
  if (paid && statusNow === 'authorised') {
    await fetch(`${base}/payments/capture`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ order_id: tamaraOrderId, total_amount: { amount: expected, currency: 'SAR' } }),
    }).catch(() => null);
  }

  await admin
    .from('orders')
    .update({
      status: paid ? 'paid' : 'failed',
      payment_ref: tamaraOrderId,
      payment_provider: 'tamara',
      payment_method: 'tamara',
      payment_status: paid ? 'paid' : statusNow,
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq('id', orderId);

  if (paid && order.user_id) {
    await admin.from('cart_items').delete().eq('user_id', order.user_id);
  }

  return json({ ok: true, status: paid ? 'paid' : statusNow });
});
