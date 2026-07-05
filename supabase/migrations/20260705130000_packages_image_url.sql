-- Package card imagery. Packages cover the same destinations as trips, so they
-- reuse the editorial photos in apps/travel-frontend/public/trips/<dest>.webp.
-- Nullable so the UI falls back to the gradient/icon placeholder.

alter table public.packages add column if not exists image_url text;

update public.packages
set image_url = '/trips/' || replace(id, '-group', '') || '.webp'
where id in ('moscow-group', 'istanbul-group', 'london-group', 'baha-group', 'red-sea');
