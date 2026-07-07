// Moyasar webhook — Supabase Edge Function.
//
// Server-to-server payment confirmation. Runs as service_role (auto-injected by
// Supabase), so it can confirm orders with no user session — the gap the Nitro
// webhook had locally. Secrets live in Supabase Vault and are read via the
// locked-down public.get_secret() RPC (never baked into this source).
//
// Point Moyasar dashboard → Webhooks at:
//   https://<project-ref>.functions.supabase.co/moyasar-webhook
// and set the webhook "Secret Token" to the value of the `moyasar_webhook_secret`
// Vault entry. Deployed with verify_jwt=false (Moyasar sends no Supabase JWT;
// authenticity is enforced via the secret token instead).

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MOYASAR_API = 'https://api.moyasar.com/v1';

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

  // 1) Verify the shared secret token.
  const webhookSecret = await getSecret('moyasar_webhook_secret');
  if (webhookSecret && body?.secret_token !== webhookSecret) {
    return json({ ok: false, reason: 'invalid_secret' }, 401);
  }

  const paymentId: string | undefined = body?.data?.id;
  if (!paymentId) return json({ ok: false, reason: 'missing_payment' }, 400);

  // 2) Re-fetch the authoritative payment from Moyasar (don't trust the body).
  const secretKey = await getSecret('moyasar_secret_key');
  if (!secretKey) return json({ ok: false, reason: 'no_secret_key' }, 500);

  const res = await fetch(`${MOYASAR_API}/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${btoa(`${secretKey}:`)}` },
  });
  if (!res.ok) return json({ ok: false, reason: 'verify_failed', status: res.status });
  const payment = await res.json();

  const orderId: string | undefined = payment?.metadata?.order_id ?? payment?.metadata?.orderId;
  if (!orderId) return json({ ok: false, reason: 'missing_order' });

  // 3) Idempotent confirm under service_role.
  const { data: order } = await admin
    .from('orders')
    .select('id, total, status, user_id')
    .eq('id', orderId)
    .maybeSingle();

  if (!order) return json({ ok: false, reason: 'order_not_found' });
  if (order.status === 'paid') return json({ ok: true, alreadyPaid: true });

  const amountOk = payment.amount === Math.round(Number(order.total) * 100);
  const paid = payment.status === 'paid' && amountOk;

  await admin
    .from('orders')
    .update({
      status: paid ? 'paid' : 'failed',
      payment_ref: payment.id,
      payment_provider: 'moyasar',
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq('id', orderId);

  if (paid && order.user_id) {
    await admin.from('cart_items').delete().eq('user_id', order.user_id);
  }

  return json({ ok: true, status: paid ? 'paid' : 'failed' });
});
