-- ============================================================
-- Durrah — payment provider settings (Tabby + Moyasar toggles)
-- A singleton settings row holding the *non-sensitive*, admin-editable payment
-- configuration surfaced to the public checkout page:
--   • which providers are enabled
--   • Tabby's publishable key + merchant code (safe for the browser — used by
--     Tabby's promo/installment widgets)
--   • whether Tabby runs against the sandbox (test) environment
--
-- Secret material (Tabby secret key, webhook secret) is NEVER stored here — it
-- lives in Supabase Vault and is read server-side via public.get_secret(),
-- exactly like the Moyasar secrets. Public read (checkout needs it); admin-only
-- write (dashboard). Mirrors public.bank_settings / public.tax_settings.
-- ============================================================

create table if not exists public.payment_settings (
  id                  int primary key default 1,
  moyasar_enabled     boolean not null default true,
  tabby_enabled       boolean not null default true,
  tabby_public_key    text    not null default '',
  tabby_merchant_code text    not null default '',
  tabby_test_mode     boolean not null default true,
  updated_at          timestamptz not null default now(),
  -- Enforce a single row.
  constraint payment_settings_singleton check (id = 1)
);

alter table public.payment_settings enable row level security;

-- Anyone may read the (non-sensitive) payment config — the public checkout page
-- decides which methods to show and renders the Tabby installment widget.
drop policy if exists payment_settings_public_read on public.payment_settings;
create policy payment_settings_public_read on public.payment_settings
  for select to anon, authenticated using (true);

-- Only admins may change which providers are enabled / the Tabby public config.
drop policy if exists payment_settings_admin_write on public.payment_settings;
create policy payment_settings_admin_write on public.payment_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed / refresh with the Tabby sandbox publishable key + merchant code.
insert into public.payment_settings
  (id, moyasar_enabled, tabby_enabled, tabby_public_key, tabby_merchant_code, tabby_test_mode)
values
  (1, true, true,
   'pk_test_019f745d-f974-3015-9193-91f1cbc82b5e',
   'goldenfuture',
   true)
on conflict (id) do update set
  tabby_public_key    = excluded.tabby_public_key,
  tabby_merchant_code = excluded.tabby_merchant_code,
  updated_at          = now();
