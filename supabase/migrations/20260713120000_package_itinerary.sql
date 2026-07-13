-- ============================================================
-- Package itinerary: per-package day-by-day program
-- (e.g. "Day 2 — Sumela Monastery" with a list of activities).
-- One row per day, ordered by `sort`. Bilingual title + items;
-- `items_*` hold one activity per line (newline-separated), which
-- the storefront renders as a bulleted list and the admin edits
-- in a plain textarea. Public read; writes gated to admins,
-- mirroring `item_options`.
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

create table if not exists public.package_days (
  id          uuid primary key default gen_random_uuid(),
  package_id  text not null references public.packages(id) on delete cascade,
  day_number  int not null default 1,
  title_ar    text not null,
  title_en    text not null,
  items_ar    text not null default '',   -- one activity per line
  items_en    text not null default '',
  sort        int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists package_days_package_idx
  on public.package_days (package_id, sort);

alter table public.package_days enable row level security;

-- Public (anon + authenticated) may READ itinerary days.
drop policy if exists package_days_public_read on public.package_days;
create policy package_days_public_read on public.package_days
  for select to anon, authenticated using (true);

-- Admins may INSERT / UPDATE / DELETE itinerary days.
drop policy if exists package_days_admin_insert on public.package_days;
drop policy if exists package_days_admin_update on public.package_days;
drop policy if exists package_days_admin_delete on public.package_days;
create policy package_days_admin_insert on public.package_days
  for insert to authenticated with check (public.is_admin());
create policy package_days_admin_update on public.package_days
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy package_days_admin_delete on public.package_days
  for delete to authenticated using (public.is_admin());
