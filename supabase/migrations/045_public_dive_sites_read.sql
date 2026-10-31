-- 045_public_dive_sites_read.sql
-- Ensures tourists and guests can read dive_sites and dive-site-photos
-- uploaded by the Tourism Office dashboard (033_dive_sites.sql only added
-- is_to_staff() SELECT policies).
-- Idempotent: safe to re-run in Supabase SQL Editor.

insert into storage.buckets (id, name, public)
values ('dive-site-photos', 'dive-site-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "Anyone can read dive sites" on public.dive_sites;
create policy "Anyone can read dive sites"
  on public.dive_sites for select
  using (true);

grant select on public.dive_sites to anon, authenticated;

drop policy if exists "Anyone can read dive site photos" on storage.objects;
create policy "Anyone can read dive site photos"
  on storage.objects for select
  using (bucket_id = 'dive-site-photos');
