# Durrah — Platform Plan (e-commerce travel)

Living plan for turning the Durrah marketing site into a scalable, bilingual
(ar/en, RTL/LTR) **e-commerce travel platform**: browse trips/packages →
wishlist → cart → checkout → **payment gateway** → orders, with user
**profiles** and **social + email auth**.

> Status legend: ✅ done · 🚧 in progress · ⬜ planned

---

## 1. Goals & principles

- **Scalable** feature-based structure (see §6) so the app grows without churn.
- **Vue 3 `<script setup lang="ts">` + Composition API**, props-down/events-up,
  logic in composables, state in Pinia stores (added when auth/cart land).
- **Supabase** as the single backend: Postgres + Row Level Security + Auth +
  (optional) Storage + Edge Functions for payment webhooks.
- **Bilingual & RTL-first** everywhere (already in place via `@nuxtjs/i18n`).
- **Security by default**: RLS on every table; secrets server-only; payment
  confirmation only via verified webhooks (never trust the client).

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | Nuxt 4 (Vue 3), Nx monorepo |
| UI | `@org/shared-ui` design system + Tailwind (tokens) |
| i18n | `@nuxtjs/i18n` (ar default `/`, en `/en`) |
| Backend | Supabase (Postgres, Auth, RLS) — project `durrah` (`snqujifbaottvysziysj`) |
| Auth | Supabase Auth: email/password + Google + Facebook OAuth |
| State | Pinia (`cart`, `wishlist`, `auth` stores) |
| Payments | **Moyasar** (recommended for KSA: mada, Apple Pay, Visa/MC) — alternatives: Tap, HyperPay, Stripe |
| Motion | GSAP (scroll reveals, hero) |

## 3. Data model (Supabase, `public` schema)

Existing: `categories`, `trips`, `packages`, `services`, `products`, `reviews`,
`faqs`, `bookings`, `newsletter_subscribers`, `contact_messages`.

New (Phase 1–2):

```
profiles                 -- 1:1 with auth.users
  id uuid PK (= auth.uid)     full_name text     username text unique
  avatar_url text             phone text         locale text default 'ar'
  created_at timestamptz

wishlists                -- a user's saved items
  id uuid PK   user_id uuid FK→auth.users   item_type text ('trip'|'package'|'product')
  item_id text   created_at   UNIQUE(user_id, item_type, item_id)

cart_items               -- current cart (per user)
  id uuid PK   user_id uuid FK   item_type text   item_id text
  quantity int default 1   unit_price numeric   created_at   UNIQUE(user_id,item_type,item_id)

orders
  id uuid PK   user_id uuid FK   status text ('pending'|'paid'|'failed'|'cancelled'|'refunded')
  currency text default 'SAR'   subtotal numeric   total numeric
  payment_provider text   payment_ref text   created_at

order_items
  id uuid PK   order_id uuid FK→orders   item_type text   item_id text
  title text   quantity int   unit_price numeric   line_total numeric
```

**RLS**
- `profiles`: owner can `select/update` own row; public `select` of safe
  columns optional later. Insert via signup trigger only.
- `wishlists`, `cart_items`, `orders`, `order_items`: `user_id = auth.uid()`
  for all of select/insert/update/delete (owner-only).
- Content tables stay public-read (already).

**Trigger**: on `auth.users` insert → create `profiles` row (username from
email prefix; can be edited later).

## 4. Auth (Supabase Auth)

- Providers: **email/password**, **Google**, **Facebook** (enable in Supabase
  dashboard → Authentication → Providers; add OAuth client IDs/secrets + redirect
  URLs `<site>/auth/callback` and `<site>/en/auth/callback`).
- `@nuxtjs/supabase` gives `useSupabaseUser()`, `useSupabaseClient().auth`.
- Pages: `/auth/login`, `/auth/register`, `/auth/callback`, `/account` (profile),
  `/account/wishlist`, `/account/orders`.
- Route protection: middleware `auth` for `/account/**` and `/checkout`.
- `stores/auth.ts` exposes `user`, `profile`, `signInWithPassword`,
  `signInWithOAuth('google'|'facebook')`, `signUp`, `signOut`.
- Navbar: show avatar/menu when logged in, else "Sign in".

## 5. E-commerce flow

1. **Browse** trips/packages/products (done) with sort/filter (add: best-seller,
   rating, price — matches reference بكجات page).
2. **Wishlist**: heart toggle on cards (hover) + `/account/wishlist`. Guests →
   prompt to sign in (or local wishlist merged on login).
3. **Cart**: "Add to cart" + quantity (product detail + cards). Guest cart in
   `localStorage`, merged to `cart_items` on login. Cart drawer + `/cart`.
4. **Checkout** (`/checkout`, auth-required): review items → create `orders` +
   `order_items` (status `pending`) server-side → create Moyasar payment →
   redirect/embed.
5. **Payment**: Moyasar hosted/embedded form. On completion, Moyasar calls our
   **webhook** (`/api/payments/webhook`, verified signature) → mark order `paid`,
   clear cart. Never mark paid from the client.
6. **Orders**: `/account/orders` + order detail.

## 6. Scalable folder structure (target)

Feature-first inside the Nuxt app; cross-app primitives stay in `libs/shared-ui`
and `libs/shared-utils`.

```
apps/travel-frontend/app/
  components/
    common/            # PageHero, TripPhoto, TripGrid …
    home/              # landing sections
    trip/              # trip detail pieces (BookingCard, Itinerary, Gallery…)
    catalog/           # cards + hover actions (TripCard wrapper, PackageCard…)
    cart/              # CartDrawer, CartLineItem, CartSummary
    account/           # ProfileForm, WishlistGrid, OrderList
    auth/              # AuthForm, OAuthButtons
  composables/
    useLocalize.ts  useCatalog.ts  useWishlist.ts  useCart.ts  useAuth.ts
  stores/              # Pinia: auth.ts, cart.ts, wishlist.ts
  middleware/          # auth.ts (protect account/checkout)
  pages/
    index / destinations / packages / services / products / contact
    trip/[id]  (or product/[id])
    auth/{login,register,callback}
    account/{index,wishlist,orders}
    cart  /  checkout
  server/api/
    bookings  newsletter  contact  trips
    cart/*  orders/*  payments/{create,webhook}
  data/  types/  assets/  i18n/
libs/
  shared-ui/    # design-system components (framework-agnostic primitives)
  shared-utils/ # gsap, useScrollReveal, formatters
  supabase-client/
```

Guidelines: route/view components are thin composition surfaces; feature UI in
`components/<feature>/`; stateful/shared logic in composables/stores; typed
props/emits; one responsibility per component.

## 7. Product detail page (matches reference `…/كوريا/pXXXX`)

Sections (built with the design system):
- **Gallery/hero** (image or gradient) + title + region + duration + rating +
  availability badge ("متوفر" / "Available").
- **Price** block (per person / for two) with Riyal symbol + **Add to cart**
  with **quantity** selector + wishlist.
- **Tabs**: Overview · Itinerary (by city/day) · Includes/Excludes · Hotels ·
  Reviews.
- **Related** trips.
Data grows: add `trips` columns later (itinerary jsonb, includes/excludes,
hotels, gallery[]) or a `trip_details` table; for now reuse static itinerary +
DB fields.

## 8. Payments — Moyasar (recommended)

- KSA-native: mada, Apple Pay, Visa/Mastercard, STC Pay; SAR settlement.
- Keys: `MOYASAR_PUBLISHABLE_KEY` (client), `MOYASAR_SECRET_KEY` (server only).
- Flow: server creates order → client pays via Moyasar form with `metadata.order_id`
  → webhook verifies + updates order. Amounts always recomputed server-side from
  `order_items` (never trust client totals).
- Alternatives if preferred: **Tap**, **HyperPay**, **Stripe** (non-KSA).

## 9. Phased roadmap

- **Phase 0 — foundations** ✅ design system, bilingual site, content in Supabase,
  packages/services/products/contact, GSAP, RTL/LTR.
- **Phase 1 — accounts & schema** 🚧 profiles/wishlist/cart/orders tables + RLS +
  signup trigger; card hover (wishlist/view); richer package dummy data.
- **Phase 2 — auth UI** ⬜ login/register/OAuth pages, `auth` store + middleware,
  Navbar account menu, `/account` profile.
- **Phase 3 — wishlist & cart** ⬜ wishlist page + toggle wired; cart store/drawer/
  page; guest→user merge.
- **Phase 4 — product detail** ⬜ rich detail page (tabs, itinerary, add-to-cart).
- **Phase 5 — checkout & payments** ⬜ orders server routes, Moyasar integration,
  webhook, orders history.
- **Phase 6 — polish** ⬜ sort/filter (best-seller/rating/price), SEO, tests, admin.

## 10. Open decisions

- Payment gateway: **Moyasar** (default) vs Tap/HyperPay/Stripe — confirm.
- Guest checkout allowed, or require account? (plan assumes account for checkout).
- Where "packages" become buyable "products" vs "trips" (unify item model?).
