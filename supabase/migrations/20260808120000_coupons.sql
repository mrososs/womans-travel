-- ============================================================
-- Durrah — discount coupons
--
-- 1. `coupons` — admin-minted percentage codes. `status` is how an admin
--    *stops* a code without destroying its history ('paused'); deleting the
--    row cascades its redemptions away entirely. `max_redemptions` is an
--    optional global cap, `expires_at` an optional deadline.
--
-- 2. `coupon_redemptions` — one row per (coupon, shopper). The partial unique
--    index `(coupon_id, user_id) where status <> 'released'` is what enforces
--    "each client can use a coupon one time only": the row is *reserved* when
--    the order is created and only becomes *redeemed* once the order is paid.
--    A failed/cancelled order releases it, so a declined card doesn't lock the
--    shopper out of retrying with the same code.
--
-- 3. `orders.coupon_id / coupon_code / discount_amount` snapshot what was
--    applied, so an order stays readable even if the coupon is later deleted.
--
-- 4. `validate_coupon()` — SECURITY DEFINER so the checkout can test a code
--    without `coupons` being publicly readable (codes must not be enumerable
--    from the browser). `reserve_coupon()` likewise lets the checkout endpoint
--    claim a redemption under RLS without a service-role key.
--
-- 5. `sync_coupon_redemption()` — a trigger on `orders.payment_status` moves a
--    reservation to 'redeemed' / 'released'. Keeping it in the database means
--    every confirmation path (Moyasar callback + webhook, Tabby, Tamara, and
--    the admin approve/cancel endpoint) is covered by one rule.
--
-- Discount ordering: the discount reduces the taxable base *before* VAT
--    (subtotal − discount → VAT → total), matching ZATCA's treatment of trade
--    discounts. Enforced server-side in server/utils/checkout.ts.
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

-- ---------- Tables ----------

create table if not exists public.coupons (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,
  discount_percent numeric(5, 2) not null check (discount_percent > 0 and discount_percent <= 100),
  status           text not null default 'active' check (status in ('active', 'paused')),
  max_redemptions  int check (max_redemptions is null or max_redemptions > 0),
  expires_at       timestamptz,
  created_by       uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.coupon_redemptions (
  id              uuid primary key default gen_random_uuid(),
  coupon_id       uuid not null references public.coupons (id) on delete cascade,
  user_id         uuid not null references auth.users (id) on delete cascade,
  order_id        uuid references public.orders (id) on delete set null,
  discount_amount numeric(10, 2) not null default 0,
  status          text not null default 'reserved' check (status in ('reserved', 'redeemed', 'released')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- The one-use rule: a shopper may hold at most one *live* redemption per code.
create unique index if not exists coupon_redemptions_live_uniq
  on public.coupon_redemptions (coupon_id, user_id)
  where status <> 'released';
create index if not exists coupon_redemptions_coupon_idx on public.coupon_redemptions (coupon_id);
create index if not exists coupon_redemptions_order_idx  on public.coupon_redemptions (order_id);

alter table public.orders
  add column if not exists coupon_id       uuid references public.coupons (id) on delete set null,
  add column if not exists coupon_code     text,
  add column if not exists discount_amount numeric(10, 2) not null default 0;

-- ---------- Code normalisation + updated_at ----------

-- Codes are matched case-insensitively by storing them upper-cased and
-- trimmed, so the plain `unique (code)` constraint is the whole story.
create or replace function public.normalize_coupon_code()
returns trigger language plpgsql set search_path = public as $$
begin
  new.code := upper(btrim(new.code));
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists coupons_normalize on public.coupons;
create trigger coupons_normalize
  before insert or update on public.coupons
  for each row execute function public.normalize_coupon_code();

-- Trigger functions must not be reachable as PostgREST RPCs.
revoke all on function public.normalize_coupon_code() from public, anon, authenticated;

-- ---------- RLS ----------

alter table public.coupons            enable row level security;
alter table public.coupon_redemptions enable row level security;

-- Coupons are admin-only end to end. Shoppers never read this table: a code is
-- tested through validate_coupon() so the list can't be enumerated.
drop policy if exists coupons_admin_all on public.coupons;
create policy coupons_admin_all on public.coupons
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- A shopper may see her own redemptions; admins see everything. Inserts happen
-- only through reserve_coupon() (SECURITY DEFINER), never directly.
drop policy if exists coupon_redemptions_sel_own on public.coupon_redemptions;
create policy coupon_redemptions_sel_own on public.coupon_redemptions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists coupon_redemptions_sel_admin on public.coupon_redemptions;
create policy coupon_redemptions_sel_admin on public.coupon_redemptions
  for select to authenticated using (public.is_admin());

drop policy if exists coupon_redemptions_del_admin on public.coupon_redemptions;
create policy coupon_redemptions_del_admin on public.coupon_redemptions
  for delete to authenticated using (public.is_admin());

-- ---------- validate_coupon() ----------

-- Returns a stable `reason` slug the UI maps to shopper-facing Arabic copy:
-- not_found | paused | expired | exhausted | already_used | unauthenticated.
create or replace function public.validate_coupon(p_code text)
returns table (valid boolean, reason text, coupon_id uuid, discount_percent numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  c    public.coupons;
  used int;
  uid  uuid := auth.uid();
begin
  if uid is null then
    return query select false, 'unauthenticated', null::uuid, null::numeric;
    return;
  end if;

  select * into c from public.coupons where code = upper(btrim(coalesce(p_code, '')));
  if not found then
    return query select false, 'not_found', null::uuid, null::numeric;
    return;
  end if;

  if c.status <> 'active' then
    return query select false, 'paused', c.id, c.discount_percent;
    return;
  end if;

  if c.expires_at is not null and c.expires_at <= now() then
    return query select false, 'expired', c.id, c.discount_percent;
    return;
  end if;

  -- Checked before the global cap so a shopper who already used the code is
  -- told exactly that, rather than the vaguer "fully redeemed".
  if exists (
    select 1 from public.coupon_redemptions r
     where r.coupon_id = c.id and r.user_id = uid and r.status <> 'released'
  ) then
    return query select false, 'already_used', c.id, c.discount_percent;
    return;
  end if;

  if c.max_redemptions is not null then
    select count(*) into used
      from public.coupon_redemptions r
     where r.coupon_id = c.id and r.status <> 'released';
    if used >= c.max_redemptions then
      return query select false, 'exhausted', c.id, c.discount_percent;
      return;
    end if;
  end if;

  return query select true, null::text, c.id, c.discount_percent;
end;
$$;

revoke all on function public.validate_coupon(text) from public;
revoke execute on function public.validate_coupon(text) from anon;
grant execute on function public.validate_coupon(text) to authenticated;

-- ---------- reserve_coupon() ----------

-- Claims the caller's single redemption of a coupon for one of her own orders.
-- Re-validates server-side (a client could call this directly) and turns the
-- unique-index collision into a clean, catchable error.
create or replace function public.reserve_coupon(
  p_coupon_id uuid,
  p_order_id  uuid,
  p_discount  numeric
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid      uuid := auth.uid();
  rid      uuid;
  v_valid  boolean;
  v_reason text;
begin
  if uid is null then
    raise exception 'unauthenticated' using errcode = '28000';
  end if;

  -- The order must exist and belong to the caller.
  if not exists (select 1 from public.orders o where o.id = p_order_id and o.user_id = uid) then
    raise exception 'order_not_found' using errcode = '42501';
  end if;

  select valid, reason into v_valid, v_reason
    from public.validate_coupon((select code from public.coupons where id = p_coupon_id));
  if coalesce(v_valid, false) is not true then
    raise exception 'coupon_invalid:%', coalesce(v_reason, 'not_found') using errcode = '23514';
  end if;

  insert into public.coupon_redemptions (coupon_id, user_id, order_id, discount_amount)
  values (p_coupon_id, uid, p_order_id, coalesce(p_discount, 0))
  returning id into rid;

  return rid;
exception
  when unique_violation then
    raise exception 'coupon_invalid:already_used' using errcode = '23505';
end;
$$;

revoke all on function public.reserve_coupon(uuid, uuid, numeric) from public;
revoke execute on function public.reserve_coupon(uuid, uuid, numeric) from anon;
grant execute on function public.reserve_coupon(uuid, uuid, numeric) to authenticated;

-- ---------- Redemption lifecycle trigger ----------

-- `orders.payment_status` carries the raw provider vocabulary as well as our
-- own (see 20260724140000_orders_bnpl_check_constraints.sql), so both sets are
-- listed explicitly. Anything not named here — the in-flight states like
-- 'authorised' / 'created' — deliberately leaves the reservation alone.
-- Only 'reserved' rows move, so a later refund never resurrects a spent code.
create or replace function public.sync_coupon_redemption()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status is distinct from old.payment_status then
    if new.payment_status in ('paid', 'captured', 'fully_captured') then
      update public.coupon_redemptions
         set status = 'redeemed', updated_at = now()
       where order_id = new.id and status = 'reserved';
    elsif new.payment_status in (
      'failed', 'cancelled', 'canceled', 'rejected',
      'declined', 'expired', 'closed', 'not_available'
    ) then
      update public.coupon_redemptions
         set status = 'released', updated_at = now()
       where order_id = new.id and status = 'reserved';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_coupon_redemption_sync on public.orders;
create trigger orders_coupon_redemption_sync
  after update of payment_status on public.orders
  for each row execute function public.sync_coupon_redemption();

revoke all on function public.sync_coupon_redemption() from public, anon, authenticated;
