-- ============================================================
-- Durrah — editable VAT (value-added tax) rate
-- A singleton settings row holding the VAT percentage applied at checkout.
-- Public read (the checkout page + pricing need it); admin-only write
-- (an admin can update it from the dashboard settings page).
-- ============================================================

create table if not exists public.tax_settings (
  id          int primary key default 1,
  vat_percent numeric(5, 2) not null default 15,
  updated_at  timestamptz not null default now(),
  -- Enforce a single row + a sane range (0–100%).
  constraint tax_settings_singleton check (id = 1),
  constraint tax_settings_range check (vat_percent >= 0 and vat_percent <= 100)
);

alter table public.tax_settings enable row level security;

-- Anyone may read the VAT rate (needed by the public checkout page + pricing).
drop policy if exists tax_settings_public_read on public.tax_settings;
create policy tax_settings_public_read on public.tax_settings
  for select to anon, authenticated using (true);

-- Only admins may update the VAT rate.
drop policy if exists tax_settings_admin_write on public.tax_settings;
create policy tax_settings_admin_write on public.tax_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed the default 15% Saudi VAT.
insert into public.tax_settings (id, vat_percent)
values (1, 15)
on conflict (id) do nothing;
