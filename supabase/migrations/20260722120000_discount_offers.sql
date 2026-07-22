-- ============================================================
-- Durrah — limited-seats discount offers (trips & packages)
--
-- Generic "first N buyers" promotional pricing: an optional lower price
-- alongside the regular one, capped to a seat count. Once claimed seats
-- reach the limit the offer silently reverts to the regular price — no
-- separate "active" flag needed, availability is derived from the counts.
--
-- discount_seats_claimed increments automatically the moment an order is
-- confirmed paid (see claim_discount_seats() below), so the storefront and
-- the admin dashboard always see a live remaining count.
--
-- Seeds the North Turkey package's launch offer: 6,150 SAR instead of 6,550
-- for the first 5 travellers.
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

do $$
declare tbl text;
begin
  foreach tbl in array array['trips', 'packages']
  loop
    execute format('alter table public.%I add column if not exists discount_price_amount numeric(10,2)', tbl);
    execute format('alter table public.%I add column if not exists discount_price_ar text', tbl);
    execute format('alter table public.%I add column if not exists discount_price_en text', tbl);
    execute format('alter table public.%I add column if not exists discount_label_ar text', tbl);
    execute format('alter table public.%I add column if not exists discount_label_en text', tbl);
    execute format('alter table public.%I add column if not exists discount_seats_limit int', tbl);
    execute format('alter table public.%I add column if not exists discount_seats_claimed int not null default 0', tbl);
  end loop;
end $$;

-- Claim seats for a (trip|package) order line once its order is confirmed
-- paid. Every payment path (Moyasar webhook/callback, bank-transfer admin
-- approval) flips `status` and `payment_status` to 'paid' together in one
-- UPDATE and is itself idempotent (guarded before the update), so a single
-- AFTER UPDATE trigger firing on either column's transition is safe.
-- SECURITY DEFINER: the trips/packages UPDATE below runs as the function
-- owner so it isn't blocked by the admin-only RLS write policies on those
-- tables (same pattern as public.is_admin() / public.handle_new_user()).
create or replace function public.claim_discount_seats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare oi record;
begin
  if (new.payment_status = 'paid' and old.payment_status is distinct from 'paid')
     or (new.status = 'paid' and old.status is distinct from 'paid') then
    for oi in
      select item_type, item_id, quantity
      from public.order_items
      where order_id = new.id and item_type in ('trip', 'package')
    loop
      if oi.item_type = 'trip' then
        update public.trips
          set discount_seats_claimed = least(discount_seats_limit, discount_seats_claimed + oi.quantity)
          where id = oi.item_id
            and discount_price_amount is not null
            and discount_seats_limit is not null
            and discount_seats_claimed < discount_seats_limit;
      else
        update public.packages
          set discount_seats_claimed = least(discount_seats_limit, discount_seats_claimed + oi.quantity)
          where id = oi.item_id
            and discount_price_amount is not null
            and discount_seats_limit is not null
            and discount_seats_claimed < discount_seats_limit;
      end if;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_claim_discount_seats on public.orders;
create trigger orders_claim_discount_seats
  after update on public.orders
  for each row execute function public.claim_discount_seats();

-- Not meant to be called directly over the API (only fires as a trigger).
revoke all on function public.claim_discount_seats() from public;
revoke execute on function public.claim_discount_seats() from anon;
revoke execute on function public.claim_discount_seats() from authenticated;

-- North Turkey launch offer: 6,150 SAR instead of 6,550 for the first 5.
update public.packages
set
  discount_price_amount = 6150,
  discount_price_ar = '٦٬١٥٠',
  discount_price_en = '6,150',
  discount_label_ar = 'خصم لأول ٥ مشتركات',
  discount_label_en = 'Offer for the first 5 travellers',
  discount_seats_limit = 5
where id = 'turkey-north';
