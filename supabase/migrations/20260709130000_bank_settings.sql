-- ============================================================
-- Durrah — editable bank-transfer account details
-- A singleton settings row holding the business bank account shown on the
-- checkout bank-transfer card. Public read (the checkout page displays it);
-- admin-only write (an admin can update it from the dashboard).
-- ============================================================

create table if not exists public.bank_settings (
  id             int primary key default 1,
  bank_name      text not null,
  account_name   text not null,
  account_number text not null,
  iban           text not null,
  updated_at     timestamptz not null default now(),
  -- Enforce a single row.
  constraint bank_settings_singleton check (id = 1)
);

alter table public.bank_settings enable row level security;

-- Anyone may read the account details (needed by the public checkout page).
drop policy if exists bank_settings_public_read on public.bank_settings;
create policy bank_settings_public_read on public.bank_settings
  for select to anon, authenticated using (true);

-- Only admins may create/update the details.
drop policy if exists bank_settings_admin_write on public.bank_settings;
create policy bank_settings_admin_write on public.bank_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed / refresh with the business account (مصرف الإنماء).
insert into public.bank_settings (id, bank_name, account_name, account_number, iban)
values (1, 'مصرف الإنماء', 'مسفره عيسى سعد الزهراني', '68207575565000', 'SA3705000068207575565000')
on conflict (id) do update set
  bank_name      = excluded.bank_name,
  account_name   = excluded.account_name,
  account_number = excluded.account_number,
  iban           = excluded.iban,
  updated_at     = now();
