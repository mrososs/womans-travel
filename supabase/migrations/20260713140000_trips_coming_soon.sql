-- ============================================================
-- Trips "coming soon" flag: when true, the destination shows a
-- "coming soon" badge on its card and cannot be added to the cart
-- (the booking button is disabled on the trip detail page). Admin-
-- editable via the trip form. Existing destinations are marked
-- coming-soon on rollout since only the groups (packages) are
-- currently bookable.
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

alter table public.trips
  add column if not exists coming_soon boolean not null default false;

-- All current destinations are not yet bookable -> mark them "coming soon".
update public.trips set coming_soon = true;
