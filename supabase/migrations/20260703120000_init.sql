-- ============================================================
-- Durrah — initial schema (bilingual ar/en content + booking flow)
-- Women's luxury travel agency. Content tables are publicly readable;
-- lead tables (bookings/newsletter/contact) are insert-only for the public.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- Content: categories ----------
create table if not exists public.categories (
  id         text primary key,            -- 'beach' | 'mountain' | 'city'
  icon       text not null,
  name_ar    text not null,
  name_en    text not null,
  sort       int  not null default 0
);

-- ---------- Content: trips ----------
create table if not exists public.trips (
  id            text primary key,          -- slug, e.g. 'alps'
  category_id   text references public.categories (id) on delete set null,
  kind          text not null check (kind in ('intl', 'local')),
  icon          text not null,
  grad          text not null,
  rating        numeric(2,1) not null default 0,
  reviews       int not null default 0,
  seats         int,                        -- null = open
  tier_key      text not null check (tier_key in ('luxury','exclusive','domestic','popular')),
  tier_variant  text not null,
  region_ar     text not null, region_en   text not null,
  title_ar      text not null, title_en    text not null,
  duration_ar   text not null, duration_en text not null,
  dates_ar      text not null, dates_en    text not null,
  price_ar      text not null, price_en    text not null,
  price_amount  numeric(10,2),              -- numeric for sorting/filtering
  featured      boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists trips_category_idx on public.trips (category_id);
create index if not exists trips_kind_idx on public.trips (kind);

-- ---------- Content: reviews ----------
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  trip_id    text references public.trips (id) on delete set null,
  icon       text not null,
  grad       text not null,
  rating     int not null default 5 check (rating between 1 and 5),
  name_ar    text not null, name_en text not null,
  trip_ar    text not null, trip_en text not null,
  text_ar    text not null, text_en text not null,
  created_at timestamptz not null default now()
);

-- ---------- Content: packages / services / products (upcoming sections) ----------
create table if not exists public.packages (
  id          text primary key,
  kind        text not null check (kind in ('intl','local')),
  icon        text not null,
  grad        text not null,
  title_ar    text not null, title_en text not null,
  desc_ar     text not null, desc_en  text not null,
  price_ar    text, price_en text,
  sort        int not null default 0
);

create table if not exists public.services (
  id       text primary key,
  icon     text not null,
  title_ar text not null, title_en text not null,
  desc_ar  text not null, desc_en  text not null,
  sort     int not null default 0
);

create table if not exists public.products (
  id        text primary key,
  icon      text not null,
  grad      text not null,
  title_ar  text not null, title_en text not null,
  desc_ar   text not null, desc_en  text not null,
  price_ar  text, price_en text,
  sort      int not null default 0
);

-- ---------- Content: FAQs ----------
create table if not exists public.faqs (
  id          uuid primary key default gen_random_uuid(),
  question_ar text not null, question_en text not null,
  answer_ar   text not null, answer_en   text not null,
  sort        int not null default 0
);

-- ---------- Leads: bookings ----------
create table if not exists public.bookings (
  id          uuid primary key default gen_random_uuid(),
  trip_id     text references public.trips (id) on delete set null,
  full_name   text not null,
  email       text not null,
  phone       text,
  travellers  int not null default 1,
  room_type   text,
  trip_date   text,
  notes       text,
  status      text not null default 'new' check (status in ('new','confirmed','cancelled')),
  created_at  timestamptz not null default now()
);

-- ---------- Leads: newsletter ----------
create table if not exists public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  locale     text not null default 'ar',
  created_at timestamptz not null default now()
);

-- ---------- Leads: contact messages ----------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  message    text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.categories             enable row level security;
alter table public.trips                  enable row level security;
alter table public.reviews                enable row level security;
alter table public.packages               enable row level security;
alter table public.services               enable row level security;
alter table public.products               enable row level security;
alter table public.faqs                   enable row level security;
alter table public.bookings               enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages       enable row level security;

-- Public (anon + authenticated) may READ content.
do $$
declare tbl text;
begin
  foreach tbl in array array['categories','trips','reviews','packages','services','products','faqs']
  loop
    execute format(
      'create policy %I on public.%I for select to anon, authenticated using (true);',
      tbl || '_public_read', tbl
    );
  end loop;
end $$;

-- Public may INSERT leads (no read back — keeps submissions private).
create policy bookings_public_insert
  on public.bookings for insert to anon, authenticated with check (true);
create policy newsletter_public_insert
  on public.newsletter_subscribers for insert to anon, authenticated with check (true);
create policy contact_public_insert
  on public.contact_messages for insert to anon, authenticated with check (true);
