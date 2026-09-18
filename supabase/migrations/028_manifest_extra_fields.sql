-- 028_manifest_extra_fields.sql
-- The create-manifest UI collects boat_contact, crew_count, and
-- instructor_name, which have no columns yet (data would be silently
-- dropped on submit). Nullable: old rows are unaffected.
-- Apply in Supabase SQL Editor (service role / postgres).

alter table public.dive_manifests
  add column if not exists boat_contact text;
alter table public.dive_manifests
  add column if not exists crew_count integer;
alter table public.dive_manifests
  add column if not exists instructor_name text;
