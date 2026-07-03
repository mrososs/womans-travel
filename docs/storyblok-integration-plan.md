# Storyblok CMS Integration Plan — Durrah

> Status: **planned, not implemented**. Approved architecture; execute the phases below when ready.

## Context

Goal: connect the site to Storyblok so editorial content becomes editable from a CMS. Storyblok does not edit Supabase rows directly — instead it becomes the **content source**:

- **Architecture:** Storyblok as the content source — the Nuxt frontend fetches editorial content from Storyblok's Content Delivery API. Supabase stays for transactional data only (auth, profiles, cart, wishlist, orders, bookings, contact, newsletter).
- **Scope:** ALL editorial content moves to Storyblok: the hardcoded marketing content in `app/data/site.ts` (hero, why, stats, reviews, categories, trips, itinerary, includes) AND the Supabase-driven catalog (packages, services, products, faqs).

Key ground truth verified in code:

- Nuxt 4 / Vue 3 app at `apps/travel-frontend` in an Nx monorepo; deps hoisted to root `package.json`. i18n: `prefix_except_default`, default `ar` (RTL) at `/`, `en` at `/en`.
- **No blocking FK problem:** `cart_items` / `wishlists` / `order_items` store loose `item_type text + item_id text` (no FKs to catalog tables) with denormalized snapshots. The only FK into content tables is `bookings.trip_id → trips(id)` (`supabase/migrations/20260703120000_init.sql:96`) — one-line migration to drop.
- Home/destinations/trip pages read hardcoded `app/data/site.ts`, NOT the (seeded but unused) `trips`/`reviews` tables. `server/api/trips.get.ts` is dead code.
- Checkout is a mockup; the bookings form never actually POSTs — commerce-integrity risk of moving the catalog is minimal.
- Module: **`@storyblok/nuxt` v9** (full Nuxt 4 support). Node 22 available.

## Design decisions

1. **Commerce linkage:** store Storyblok story **slugs** in `item_id` (reuse today's ids — `alps`, existing package/product ids — as slugs so existing cart/wishlist rows stay valid). Drop `bookings_trip_id_fkey` via migration. No shadow rows / no sync pipeline. Add `price_amount` (number) fields in Storyblok for future server-side price re-validation.
2. **i18n:** Storyblok **field-level translation**, space default language = Arabic, `en` as additional language. Fetch with `language: locale === 'ar' ? 'default' : 'en'` + `fallback_lang: 'default'`. This retires the `Loc {ar,en}` pattern — composables return pre-localized strings; `lc()`/`useDbPick()` usage is removed from migrated components.
3. **Content model:** story folders `trips/`, `packages/`, `services/`, `products/`, `faqs/` (ordering via story position, replacing `sort` columns) + one global `site-settings` story (hero_slides, why_items, stats, reviews, categories, default_includes). NAV stays in code (structural). Hero images keep `/hero/*.webp` paths initially (preserves the LCP preload at `nuxt.config.ts:69-75`).
4. **Code location:** app-level (`apps/travel-frontend/app/`), no new Nx lib — composables depend on Nuxt auto-imports; only one app exists.
5. **Seeding:** Management API seed script (repeatable, idempotent), not manual entry — ~45 stories × 2 languages transcribed from `site.ts` + `supabase/seed.sql`.

## Implementation phases

Dev server: `pnpm nx serve travel-frontend` → http://localhost:4200 (ar) and `/en`.

### Phase 0 — Module install + config

- Root `package.json`: add `@storyblok/nuxt@^9` to dependencies.
- `apps/travel-frontend/nuxt.config.ts`: add module; `storyblok: { accessToken, bridge: IS_SB_PREVIEW, apiOptions: { region: 'eu' } }`; `runtimeConfig.public.storyblokVersion`.
- CSP (`nuxt.config.ts:16-28`): add `https://api.storyblok.com` to `connect-src`, `https://a.storyblok.com` to `img-src`. When `STORYBLOK_PREVIEW=true` only: add `https://app.storyblok.com` to `script-src`/`connect-src`, set `frame-ancestors 'self' https://app.storyblok.com`, omit `x-frame-options` (visual-editor iframe). Production headers unchanged.
- `.env.example`: `STORYBLOK_ACCESS_TOKEN`, `STORYBLOK_VERSION`, `STORYBLOK_PREVIEW`, `STORYBLOK_MANAGEMENT_TOKEN`, `STORYBLOK_SPACE_ID`.
- **Manual (owner):** create EU Storyblok space, add `en` language, obtain preview + management tokens.
- Verify: app boots, all pages unchanged, no CSP violations.

### Phase 1 — Component schemas + seed script

- Create `tools/storyblok/components.json` (content-type schemas: trip, package, service, product, faq, site_settings + nested bloks: hero_slide, why_item, stat_item, review, category_item, highlight, itinerary_day, include_item; translatable fields marked).
- Create `tools/storyblok/content.json` (seed content from `site.ts` + `supabase/seed.sql`; ar as default values, en via `field__i18n__en` keys).
- Create `tools/storyblok/seed.mjs` (fetch against `mapi.storyblok.com`: ensure `en` language → upsert components → create folders → upsert stories by slug with positions → publish). Root script `"seed:storyblok"`.
- Verify: run seed twice (idempotent); CDA curl returns 6 trips with `language=en`; `site-settings` story returns all blocks.

### Phase 2 — CMS composables + types (additive, nothing swapped yet)

- Create `apps/travel-frontend/app/types/cms.ts`: `CmsTrip`, `CmsPackage`, `CmsService`, `CmsProduct`, `CmsFaq`, `SiteSettings` + `mapTrip()` etc. mappers isolating the story shape.
- Create `apps/travel-frontend/app/composables/useCmsContent.ts`: `useCmsTrips()`, `useCmsTrip(slug)`, `useCmsPackages()`, `useCmsPackage(slug)`, `useCmsServices()`, `useCmsProducts()`, `useCmsFaqs()`, `useSiteSettings()` — pattern: `useStoryblokApi()` + `useAsyncData` with **locale-keyed keys and `watch: [locale]`** (client-side language switch must refetch), `version` from runtimeConfig, `fallback_lang: 'default'`, `sort_by: 'position:asc'`. Bridge registration (`useStoryblokBridge`) when `version === 'draft'` for live preview on real pages (no `<StoryblokComponent>` blok-page pattern — pages are code-designed).
- Verify: SSR HTML (view-source) contains Arabic trip titles; no hydration warnings.

### Phase 3 — Marketing content cutover (site-settings)

- Modify `components/home/HeroCarousel.vue`, `WhySection.vue`, `StatsBand.vue`, `ReviewsSection.vue`, `pages/index.vue` (category chips) → `useSiteSettings()`.
- Verify: `/` and `/en/` visually identical to before in both locales; LCP preload still hits `/hero/hero-1.webp`; RTL + Arabic numerals intact; scroll-reveal animations fire.

### Phase 4 — Trips cutover + bookings migration

- Modify `pages/index.vue` (TRIPS → `useCmsTrips()` featured), `pages/destinations.vue` (filter/search over `CmsTrip`), `pages/trip/[id].vue` (`useCmsTrip(slug)`, 404 via `createError` on missing story), `components/TripGrid.vue`, `components/trip/BookingCard.vue` (prop types → `CmsTrip`, drop `lc()`).
- Create migration `supabase/migrations/<ts>_bookings_trip_slug.sql`: `alter table public.bookings drop constraint if exists bookings_trip_id_fkey;` + column comment.
- Verify: `/destinations` Arabic search ("العلا"), category/kind filters; `/trip/alps` ar+en (itinerary, includes, booking dialog); `/trip/garbage` → 404.

### Phase 5 — Commercial catalog cutover

- Modify `pages/packages/index.vue`, `pages/packages/[id].vue` (→ `useCmsPackage(slug)`; `priceAmount` from the number field instead of regex-parsing `price_en`; cart/wishlist keep `item_type:'package', item_id: slug`), `pages/services.vue`, `pages/products.vue`, `components/FaqSection.vue`.
- Delete `app/composables/useCatalog.ts` (all consumers gone).
- Verify (**critical commerce regression pass**): guest add-to-cart (localStorage `durrah-cart`) → sign in → merge into Supabase `cart_items` with slug `item_id`s; quantity stepper + `/cart` totals; wishlist persists across reload; pre-cutover cart rows still render (snapshots); FAQs in both locales.

### Phase 6 — Cleanup + preview mode + schema retirement

- Delete `app/data/site.ts` (move NAV → new `app/data/nav.ts`; update `layouts/default.vue`), delete `app/composables/useLocalize.ts` if no consumers remain, delete dead `server/api/trips.get.ts`.
- New migration dropping content tables (`reviews` first — FK — then `trips`, `categories`, `packages`, `services`, `products`, `faqs`); regenerate `app/types/database.types.ts`; prune `supabase/seed.sql` to transactional-only.
- Update README/docs data-flow description.
- Verify: full click-through ar/en; `grep -rn "data/site\|useCatalog\|useDbPick"` empty; `pnpm nx build travel-frontend` succeeds; production headers stay strict when `STORYBLOK_PREVIEW` unset.

## What stays on Supabase (unchanged)

`profiles`, `wishlists`, `cart_items`, `orders`, `order_items`, `bookings`, `newsletter_subscribers`, `contact_messages`, auth trigger; `useCart.ts`, `useWishlist.ts`, `useProfile.ts`, `useAuth`; `server/api/{bookings,contact,newsletter}.post.ts`.

## Risks

- Locale switch without refetch is the most likely subtle bug — mitigated by locale-keyed `useAsyncData` + `watch: [locale]`.
- Seeding requires a Storyblok space + tokens (Phase 0 prerequisite for verifying Phases 1+; code can be written without them).
- Moving hero images to Storyblok assets later must revisit the LCP preload (`nuxt.config.ts:69-75`) or it regresses the measured ~570ms win.

## End-to-end verification

Run `pnpm nx serve travel-frontend`; click through `/`, `/destinations`, `/trip/alps`, `/packages`, `/packages/<slug>`, `/services`, `/products`, `/cart`, contact + newsletter forms — in both `/` (ar, RTL) and `/en`. Confirm cart merge on login, booking dialog, 404 on bad slug, and `pnpm nx build travel-frontend` green. Content edit test: change a trip title in Storyblok, publish, reload — the change appears.
