-- 033_dive_sites.sql
-- Staff-managed dive site registry. Dives count stays derived client-side
-- (manifests joined by location = name); photos live in storage, not
-- dataURLs. No DELETE policy by design (the UI cycles status instead).
-- If the table already existed before this spec (missing columns → PGRST204
-- on insert), apply 033b_dive_sites_reconcile.sql afterwards.
-- Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres), after 030.

create table if not exists public.dive_sites (
  id uuid primary key default gen_random_uuid(),
  site_code text unique not null,
  name text unique not null,
  barangay text not null,
  depth_range text not null,
  difficulty text not null check (difficulty in ('Open Water','Advanced','Rescue','Divemaster','Instructor')),
  site_type text not null check (site_type in ('Reef','Wreck','Wall','Drift','Night')),
  status text not null default 'Active' check (status in ('Active','Seasonal','Restricted')),
  description text,
  photo_url text,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.dive_sites enable row level security;

drop policy if exists "Staff can view all dive sites" on public.dive_sites;
create policy "Staff can view all dive sites"
  on public.dive_sites for select using (public.is_to_staff());
drop policy if exists "Staff can insert dive sites" on public.dive_sites;
create policy "Staff can insert dive sites"
  on public.dive_sites for insert with check (public.is_to_staff());
drop policy if exists "Staff can update dive sites" on public.dive_sites;
create policy "Staff can update dive sites"
  on public.dive_sites for update using (public.is_to_staff());

grant select, insert, update on public.dive_sites to authenticated;

insert into storage.buckets (id, name, public)
values ('dive-site-photos', 'dive-site-photos', true)
on conflict (id) do nothing;

drop policy if exists "Staff can read all site photos" on storage.objects;
create policy "Staff can read all site photos"
  on storage.objects for select
  using (bucket_id = 'dive-site-photos' and public.is_to_staff());
drop policy if exists "Staff can upload site photos" on storage.objects;
create policy "Staff can upload site photos"
  on storage.objects for insert
  with check (bucket_id = 'dive-site-photos' and public.is_to_staff());

-- Realtime push for the Dive Sites tab (optional; "already a member"
-- means push is already on — skip in that case).
alter publication supabase_realtime add table public.dive_sites;

-- Verification probes (run after applying):
--   select policyname from pg_policies
--    where schemaname = 'public' and tablename = 'dive_sites';
--   select id from storage.buckets where id = 'dive-site-photos';
--   -- location↔name match check (decides whether dive counts work as-is):
--   select location, count(*) from dive_manifests group by location;
