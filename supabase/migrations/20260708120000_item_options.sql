-- ============================================================
-- Item options: per-trip / per-package purchasable variants
-- (e.g. "Single room", "Shared room", "Deposit"), each with its
-- own price. Polymorphic like cart_items/wishlists via
-- (item_type, item_id). Public read; writes gated to admins.
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

create table if not exists public.item_options (
  id            uuid primary key default gen_random_uuid(),
  item_type     text not null check (item_type in ('trip', 'package')),
  item_id       text not null,               -- trips.id / packages.id (polymorphic, no FK)
  label_ar      text not null,
  label_en      text not null,
  price_amount  numeric(10,2) not null default 0,
  available     boolean not null default true,
  sort          int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists item_options_item_idx
  on public.item_options (item_type, item_id, sort);

alter table public.item_options enable row level security;

-- Public (anon + authenticated) may READ options.
drop policy if exists item_options_public_read on public.item_options;
create policy item_options_public_read on public.item_options
  for select to anon, authenticated using (true);

-- Admins may INSERT / UPDATE / DELETE options.
drop policy if exists item_options_admin_insert on public.item_options;
drop policy if exists item_options_admin_update on public.item_options;
drop policy if exists item_options_admin_delete on public.item_options;
create policy item_options_admin_insert on public.item_options
  for insert to authenticated with check (public.is_admin());
create policy item_options_admin_update on public.item_options
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy item_options_admin_delete on public.item_options
  for delete to authenticated using (public.is_admin());
