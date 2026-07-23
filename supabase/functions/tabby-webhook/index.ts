// Tabby webhook — Supabase Edge Function.
//
// Server-to-server payment confirmation for the Tabby "Pay in 4" flow. Runs as
// service_role (auto-injected by Supabase), so it can confirm orders with no
// user session. Secrets live in Supabase Vault and are read via the locked-down
// public.get_secret() RPC (never baked into this source).
//
// Register the webhook with Tabby (POST https://api.tabby.ai/api/v1/webhooks)
// pointing at:
//   https://<project-ref>.functions.supabase.co/tabby-webhook
// and set a header (e.g. X-Webhook-Secret) to the value of the
// `tabby_webhook_secret` Vault entry. Deployed with verify_jwt=false (Tabby
// sends no Supabase JWT; authenticity is enforced via that header + an
// authoritative re-fetch of the payment).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const TABBY_API = 'https://api.tabby.ai/api/v2';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
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

  // 1) Verify the shared secret header we registered with Tabby.
  const webhookSecret = await getSecret('tabby_webhook_secret');
  if (webhookSecret) {
    const provided =
      req.headers.get('x-webhook-secret') ??
      req.headers.get('x-tabby-signature') ??
      (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (provided !== webhookSecret) {
      return json({ ok: false, reason: 'invalid_secret' }, 401);
    }
  }

  const paymentId: string | undefined = body?.id;
  if (!paymentId) return json({ ok: false, reason: 'missing_payment' }, 400);

  // 2) Re-fetch the authoritative payment from Tabby (don't trust the body).
  const secretKey = await getSecret('tabby_secret_key');
  if (!secretKey) return json({ ok: false, reason: 'no_secret_key' }, 500);

  const res = await fetch(`${TABBY_API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  if (!res.ok) return json({ ok: false, reason: 'verify_failed', status: res.status });
  const payment = await res.json();

  const orderId: string | undefined = payment?.order?.reference_id ?? undefined;
  if (!orderId) return json({ ok: false, reason: 'missing_order' });

  // 3) Idempotent confirm under service_role.
  const { data: order } = await admin
    .from('orders')
    .select('id, total, status, user_id')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return json({ ok: false, reason: 'order_not_found' });
  if (order.status === 'paid') return json({ ok: true, alreadyPaid: true });

  const amountOk = Number(payment.amount) === Math.round(Number(order.total) * 100) / 100;
  const authorized = payment.status === 'AUTHORIZED' || payment.status === 'CLOSED';
  const paid = authorized && amountOk;

  // Capture the full amount on first authorization (settlement).
  if (paid && payment.status === 'AUTHORIZED') {
    await fetch(`${TABBY_API}/payments/${encodeURIComponent(paymentId)}/captures`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: (Math.round(Number(order.total) * 100) / 100).toFixed(2) }),
    }).catch(() => null);
  }

  await admin
    .from('orders')
    .update({
      status: paid ? 'paid' : 'failed',
      payment_ref: payment.id,
      payment_provider: 'tabby',
      payment_method: 'tabby',
      payment_status: paid ? 'paid' : String(payment.status).toLowerCase(),
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq('id', orderId);

  if (paid && order.user_id) {
    await admin.from('cart_items').delete().eq('user_id', order.user_id);
  }

  return json({ ok: true, status: paid ? 'paid' : String(payment.status).toLowerCase() });
});
