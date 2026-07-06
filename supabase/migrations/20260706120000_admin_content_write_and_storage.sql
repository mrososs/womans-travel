-- ============================================================
-- Admin content management: write access to trips & packages,
-- plus a public 'content' storage bucket for editorial photos.
-- Public read stays open; writes are gated to admins via is_admin().
-- (Applied to the durrah project via MCP apply_migration.)
-- ============================================================

-- ---------- Admin write policies: trips ----------
drop policy if exists trips_admin_insert on public.trips;
drop policy if exists trips_admin_update on public.trips;
drop policy if exists trips_admin_delete on public.trips;
create policy trips_admin_insert on public.trips
  for insert to authenticated with check (public.is_admin());
create policy trips_admin_update on public.trips
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy trips_admin_delete on public.trips
  for delete to authenticated using (public.is_admin());

-- ---------- Admin write policies: packages ----------
drop policy if exists packages_admin_insert on public.packages;
drop policy if exists packages_admin_update on public.packages;
drop policy if exists packages_admin_delete on public.packages;
create policy packages_admin_insert on public.packages
  for insert to authenticated with check (public.is_admin());
create policy packages_admin_update on public.packages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy packages_admin_delete on public.packages
  for delete to authenticated using (public.is_admin());

-- ---------- Storage: public 'content' bucket ----------
insert into storage.buckets (id, name, public)
values ('content', 'content', true)
on conflict (id) do update set public = true;

-- Anyone may read objects in the public content bucket.
drop policy if exists content_public_read on storage.objects;
create policy content_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'content');

-- Admins may upload / replace / remove objects in the content bucket.
drop policy if exists content_admin_insert on storage.objects;
drop policy if exists content_admin_update on storage.objects;
drop policy if exists content_admin_delete on storage.objects;
create policy content_admin_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'content' and public.is_admin());
create policy content_admin_update on storage.objects
  for update to authenticated using (bucket_id = 'content' and public.is_admin()) with check (bucket_id = 'content' and public.is_admin());
create policy content_admin_delete on storage.objects
  for delete to authenticated using (bucket_id = 'content' and public.is_admin());
