-- ============================================================
-- get_secret(name) — read a Vault secret from trusted server code only.
-- Used by the moyasar-webhook Edge Function (which runs as service_role) to
-- read the Moyasar secret key + webhook secret without baking them into the
-- function source. Locked down: revoked from anon/authenticated so it is never
-- reachable with a browser (anon/JWT) key via PostgREST.
-- ============================================================

create or replace function public.get_secret(p_name text)
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = p_name
  limit 1;
$$;

revoke all on function public.get_secret(text) from public, anon, authenticated;
grant execute on function public.get_secret(text) to service_role;