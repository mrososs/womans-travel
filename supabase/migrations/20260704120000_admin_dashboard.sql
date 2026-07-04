-- ============================================================
-- Durrah — admin dashboard (roles, package economics, admin RLS, stats RPCs)
-- Adds an admin role to profiles, cost/price to packages, an is_admin() guard,
-- admin-scoped read policies, and SECURITY DEFINER report functions.
-- ============================================================

-- 1) Role on profiles ---------------------------------------------------------
alter table public.profiles
  add column if not exists role text not null default 'user'
  check (role in ('user','admin'));

-- 2) Package economics (numeric sale price + cost, for profit reporting) ------
alter table public.packages add column if not exists price_amount numeric(10,2);
alter table public.packages add column if not exists cost_amount  numeric(10,2);

-- 3) is_admin() — SECURITY DEFINER so admin policies on profiles do NOT recurse
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

-- 4) Admin read policies (additive; existing owner-scoped policies remain) -----
drop policy if exists orders_select_admin       on public.orders;
drop policy if exists order_items_select_admin  on public.order_items;
drop policy if exists bookings_select_admin     on public.bookings;
drop policy if exists profiles_select_admin     on public.profiles;
drop policy if exists packages_select_admin     on public.packages;

create policy orders_select_admin      on public.orders      for select to authenticated using (public.is_admin());
create policy order_items_select_admin on public.order_items for select to authenticated using (public.is_admin());
create policy bookings_select_admin    on public.bookings    for select to authenticated using (public.is_admin());
create policy profiles_select_admin    on public.profiles    for select to authenticated using (public.is_admin());
create policy packages_select_admin    on public.packages    for select to authenticated using (public.is_admin());

-- 5) Monthly report RPC -------------------------------------------------------
create or replace function public.admin_monthly_report(months int default 12)
returns table (
  month          date,
  buyers         bigint,
  orders_count   bigint,
  package_units  bigint,
  revenue        numeric,
  cost           numeric,
  profit         numeric,
  profit_pct     numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with pkg as (
    select
      o.id                                        as order_id,
      o.user_id,
      date_trunc('month', o.created_at)::date     as m,
      oi.quantity,
      oi.line_total,
      coalesce(p.cost_amount, 0) * oi.quantity    as item_cost
    from public.orders o
    join public.order_items oi
      on oi.order_id = o.id and oi.item_type = 'package'
    left join public.packages p
      on p.id = oi.item_id
    where o.status = 'paid'
      and o.created_at >= (date_trunc('month', now()) - ((months - 1) || ' months')::interval)
  )
  select
    m,
    count(distinct user_id),
    count(distinct order_id),
    coalesce(sum(quantity), 0),
    coalesce(sum(line_total), 0),
    coalesce(sum(item_cost), 0),
    coalesce(sum(line_total - item_cost), 0),
    case when coalesce(sum(line_total), 0) > 0
         then round(sum(line_total - item_cost) / sum(line_total) * 100, 1)
         else 0 end
  from pkg
  group by m
  order by m;
end;
$$;

revoke all on function public.admin_monthly_report(int) from public;
revoke execute on function public.admin_monthly_report(int) from anon;
grant execute on function public.admin_monthly_report(int) to authenticated;

-- 6) All-time overview RPC (top KPI cards) ------------------------------------
create or replace function public.admin_overview()
returns table (
  total_buyers  bigint,
  total_orders  bigint,
  total_units   bigint,
  revenue       numeric,
  cost          numeric,
  profit        numeric,
  profit_pct    numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  return query
  with pkg as (
    select
      o.user_id,
      o.id                                       as order_id,
      oi.quantity,
      oi.line_total,
      coalesce(p.cost_amount, 0) * oi.quantity   as item_cost
    from public.orders o
    join public.order_items oi
      on oi.order_id = o.id and oi.item_type = 'package'
    left join public.packages p
      on p.id = oi.item_id
    where o.status = 'paid'
  )
  select
    count(distinct user_id),
    count(distinct order_id),
    coalesce(sum(quantity), 0),
    coalesce(sum(line_total), 0),
    coalesce(sum(item_cost), 0),
    coalesce(sum(line_total - item_cost), 0),
    case when coalesce(sum(line_total), 0) > 0
         then round(sum(line_total - item_cost) / sum(line_total) * 100, 1)
         else 0 end
  from pkg;
end;
$$;

revoke all on function public.admin_overview() from public;
revoke execute on function public.admin_overview() from anon;
grant execute on function public.admin_overview() to authenticated;
