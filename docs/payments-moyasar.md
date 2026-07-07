# Payments — Moyasar integration

Real Moyasar payment gateway wired into `/checkout`. Card data goes directly to
Moyasar's hosted form (PCI-safe); orders are only confirmed **server-side** after
Moyasar reports the charge as paid. See `docs/plan.md §8`.

## Flow

```
/checkout (CheckoutPayment.vue)
  → POST /api/payments/create        # auth-required; builds pending order + order_items
                                     #   from the cart (demo fallback), total +15% VAT
                                     #   recomputed server-side; returns amount (halalas)
  → Moyasar.js hosted form           # methods: creditcard (mada/Visa/MC); metadata.order_id
  → GET  /api/payments/callback      # re-fetches payment via Moyasar API; marks order paid
                                     #   only if status+amount match; clears cart
  → /checkout/success | /checkout/failed

POST /api/payments/webhook           # Nitro fallback (needs SUPABASE_SERVICE_KEY)
Edge Function: moyasar-webhook       # canonical async confirmation (runs as service_role)
```

## Where the keys live

| Key | Local dev | Production (Vercel) | Supabase |
|---|---|---|---|
| `MOYASAR_PUBLISHABLE_KEY` (public) | `.env` — **test** `pk_test_…` | env var — **live** `pk_live_…` | — |
| `MOYASAR_SECRET_KEY` (server only) | `.env` — **test** `sk_test_…` | env var — **live** `sk_live_…` | Vault `moyasar_secret_key` (active=test), `moyasar_secret_key_live` (stashed) |
| `MOYASAR_WEBHOOK_SECRET` | `.env` | env var (same value) | Vault `moyasar_webhook_secret` |
| `SUPABASE_SERVICE_KEY` | optional | optional (Nitro webhook only) | — (Edge Function gets service role automatically) |

- Live keys are **never committed** — `.env` is gitignored; only var *names* appear in `.env.example`.
- The Edge Function reads its secrets from Vault via the locked-down `public.get_secret()` RPC
  (granted to `service_role` only; revoked from `anon`/`authenticated`).

## Edge Function webhook

- Deployed as `moyasar-webhook` (`verify_jwt=false`; authenticity via the secret token).
- URL: `https://snqujifbaottvysziysj.functions.supabase.co/moyasar-webhook`
  (also `https://snqujifbaottvysziysj.supabase.co/functions/v1/moyasar-webhook`).
- In the Moyasar dashboard → **Webhooks**: set the URL above and the **Secret Token** to the
  `moyasar_webhook_secret` value. Configure it in **both** the test and live dashboards.

## Go-live checklist (switch from test → live)

1. **Vercel env vars** (Project → Settings → Environment Variables, Production):
   - `MOYASAR_PUBLISHABLE_KEY = pk_live_…`
   - `MOYASAR_SECRET_KEY = sk_live_…`
   - `MOYASAR_WEBHOOK_SECRET = <same webhook secret>`
   - (values are stashed in Supabase Vault as `moyasar_*_live`)
2. **Point the Edge Function at live** — swap the active Vault secret so the async webhook
   verifies live payments:
   ```sql
   select vault.update_secret(
     (select id from vault.secrets where name = 'moyasar_secret_key'),
     (select decrypted_secret from vault.decrypted_secrets where name = 'moyasar_secret_key_live')
   );
   ```
3. **Moyasar LIVE dashboard → Webhooks**: add the Edge Function URL + the webhook secret token.
4. Redeploy the site. Verify with one small **real** transaction, then refund it from the
   Moyasar dashboard.

> ⚠️ Live keys charge real cards. Keep local dev on the test keys; only production uses live.

## Test cards (test env)

| Card | Result |
|---|---|
| `4111 1111 1111 1111` (Visa) | paid |
| `4201 3201 1111 1010` (mada) | paid |

Name = any two words, future expiry, any 3-digit CVC.
