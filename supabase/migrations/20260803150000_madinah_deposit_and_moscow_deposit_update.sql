-- ============================================================
-- Durrah — Madinah economy deposit + Moscow deposit bump
--
-- Adds a deposit option to the Madinah economy package (500) and raises the
-- Moscow deposit from 3,000 to 3,500 on both the group package and its
-- matching destination card (trips.moscow), keeping them in sync.
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

update public.packages set deposit_amount = 500 where id = 'madinah-economy';
update public.packages set deposit_amount = 3500 where id = 'moscow';
update public.trips set deposit_amount = 3500 where id = 'moscow';
