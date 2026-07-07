-- ============================================================
-- Durrah — reports cover trips (travels) too, not just packages.
-- The dashboard reports must reflect real paid orders across BOTH packages and
-- trips (and any other purchasable item), with profit from each item's cost.
-- Adds trips.cost_amount and rewrites the two report RPCs to aggregate every
-- paid order_item, sourcing cost from packages OR trips. Column names are kept
-- identical so the typed frontend keeps working (package_units now = all units).
-- ============================================================

-- Cost for trips (mirrors packages.cost_amount) so profit is computable.
alter table public.trips add column if not exists cost_amount numeric(10,2);

-- Monthly report — all paid items, cost from packages or trips.
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
  with items as (
    select
      o.id                                     as order_id,
      o.user_id,
      date_trunc('month', o.created_at)::date  as m,
      oi.quantity,
      oi.line_total,
      coalesce(p.cost_amount, tr.cost_amount, 0) * oi.quantity as item_cost
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    left join public.packages p  on oi.item_type = 'package' and p.id  = oi.item_id
    left join public.trips    tr on oi.item_type = 'trip'    and tr.id = oi.item_id
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
  from items
  group by m
  order by m;
end;
$$;

-- All-time overview — same broadening.
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
  with items as (
    select
      o.user_id,
      o.id                                     as order_id,
      oi.quantity,
      oi.line_total,
      coalesce(p.cost_amount, tr.cost_amount, 0) * oi.quantity as item_cost
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    left join public.packages p  on oi.item_type = 'package' and p.id  = oi.item_id
    left join public.trips    tr on oi.item_type = 'trip'    and tr.id = oi.item_id
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
  from items;
end;
$$;

revoke all on function public.admin_monthly_report(int) from public;
revoke execute on function public.admin_monthly_report(int) from anon;
grant execute on function public.admin_monthly_report(int) to authenticated;
revoke all on function public.admin_overview() from public;
revoke execute on function public.admin_overview() from anon;
grant execute on function public.admin_overview() to authenticated;