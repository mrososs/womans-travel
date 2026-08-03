-- ============================================================
-- Durrah — deposit-only bank transfer payments + package "sold out"
--
-- 1. Deposit amounts. `trips.deposit_amount` / `packages.deposit_amount`
--    (nullable) mark an item as deposit-eligible and set the flat deposit
--    amount, e.g. Moscow (trip) 3,000 and the Red Sea group (trip card +
--    package) 2,000. When a shopper's whole cart is deposit-eligible, the
--    checkout's bank-transfer panel offers "pay deposit only" — the client
--    is never trusted, so the checkout endpoint recomputes the deposit total
--    server-side from these columns before charging it.
--
-- 2. `orders.is_deposit_payment` / `orders.paid_amount` record that an order
--    was settled with a deposit rather than the full amount: `total` keeps
--    the full booking value (unchanged), `paid_amount` is what was actually
--    collected now, so admin can show the remaining balance due.
--
-- 3. `packages.sold_out` — mirrors `trips.coming_soon` but for a package that
--    already ran and is no longer bookable (e.g. "الشمال التركي" / North
--    Turkey), instead of one that hasn't opened yet.
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

alter table public.trips
  add column if not exists deposit_amount numeric(10,2);

alter table public.packages
  add column if not exists deposit_amount numeric(10,2),
  add column if not exists sold_out boolean not null default false;

alter table public.orders
  add column if not exists is_deposit_payment boolean not null default false,
  add column if not exists paid_amount numeric(10,2);

-- Backfill: every pre-existing order was paid (or is pending) in full.
update public.orders set paid_amount = total where paid_amount is null;

-- ---------- Deposits ----------
update public.trips set deposit_amount = 3000 where id = 'moscow';
update public.trips set deposit_amount = 2000 where id = 'red-sea';
update public.packages set deposit_amount = 2000 where id = 'red-sea';

-- ---------- Sold out ----------
update public.packages set sold_out = true where id = 'turkey-north';
