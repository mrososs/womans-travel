-- Trip card imagery. Each trip row references an editorial photo served from
-- the app's static assets (apps/travel-frontend/public/trips/<id>.webp). The
-- column is nullable so the UI falls back to the gradient/icon placeholder when
-- a trip has no photo yet.

alter table public.trips add column if not exists image_url text;

update public.trips set image_url = '/trips/' || id || '.webp'
where id in ('moscow', 'istanbul', 'london', 'baha', 'red-sea');
