-- ============================================================
-- Durrah — add Tamara (BNPL) to payment_settings
-- Extends the public.payment_settings singleton with the *non-sensitive*,
-- admin-editable Tamara config surfaced to the checkout page (enabled flag,
-- publishable/public key, sandbox flag). Mirrors the Tabby columns.
--
-- Secret material (Tamara API JWT token, webhook notification token) lives in
-- Supabase Vault (tamara_api_token / tamara_notification_token) and is read
-- server-side via public.get_secret() — never stored here.
-- ============================================================

alter table public.payment_settings
  add column if not exists tamara_enabled   boolean not null default true,
  add column if not exists tamara_public_key text   not null default '',
  add column if not exists tamara_test_mode boolean not null default true;

-- Seed the Tamara sandbox public key on the singleton row.
update public.payment_settings
  set tamara_public_key = 'f03f249b-854b-4251-b922-68e928745c8a',
      tamara_enabled    = true,
      tamara_test_mode  = true,
      updated_at        = now()
  where id = 1;
