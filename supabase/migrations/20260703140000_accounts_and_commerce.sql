-- ============================================================
-- Durrah — accounts & commerce (profiles, wishlist, cart, orders)
-- See docs/plan.md §3–§5. Owner-scoped RLS; profile auto-created on signup.
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  username text unique,
  avatar_url text,
  phone text,
  locale text not null default 'ar',
  created_at timestamptz not null default now()
);

create table if not exists public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('trip','package','product')),
  item_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('trip','package','product')),
  item_id text not null,
  quantity int not null default 1 check (quantity > 0),
  unit_price numeric(10,2),
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','paid','failed','cancelled','refunded')),
  currency text not null default 'SAR',
  subtotal numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  payment_provider text,
  payment_ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  item_type text not null,
  item_id text not null,
  title text,
  quantity int not null default 1,
  unit_price numeric(10,2) not null default 0,
  line_total numeric(10,2) not null default 0
);
create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.profiles    enable row level security;
alter table public.wishlists   enable row level security;
alter table public.cart_items  enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using (id = auth.uid());
create policy profiles_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_insert_own on public.profiles for insert to authenticated with check (id = auth.uid());

do $$
declare tbl text;
begin
  foreach tbl in array array['wishlists','cart_items','orders']
  loop
    execute format('create policy %I on public.%I for select to authenticated using (user_id = auth.uid());', tbl||'_sel_own', tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check (user_id = auth.uid());', tbl||'_ins_own', tbl);
    execute format('create policy %I on public.%I for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());', tbl||'_upd_own', tbl);
    execute format('create policy %I on public.%I for delete to authenticated using (user_id = auth.uid());', tbl||'_del_own', tbl);
  end loop;
end $$;

create policy order_items_sel_own on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy order_items_ins_own on public.order_items for insert to authenticated
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    split_part(new.email, '@', 1) || '_' || substr(replace(new.id::text, '-', ''), 1, 6),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
