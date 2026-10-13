-- 032_manifest_verify.sql
-- Staff verification state for the dashboard manifest registry.
-- Separate from the operator lifecycle status ('active'/'done'), which the
-- dashboard never writes. Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres), after 030.

alter table public.dive_manifests
  add column if not exists verified boolean not null default false;

alter table public.dive_manifests
  add column if not exists verified_at timestamptz;

drop policy if exists "Staff can update dive manifests" on public.dive_manifests;
create policy "Staff can update dive manifests"
  on public.dive_manifests for update using (public.is_to_staff());

grant update on public.dive_manifests to authenticated;

-- Realtime push for the Manifestos tab (optional; without it the dashboard
-- falls back to 30s stale + post-write refetch). "Already a member" errors
-- mean push is already on — skip in that case.
alter publication supabase_realtime add table public.dive_manifests;
alter publication supabase_realtime add table public.manifest_divers;

-- Verification probes (run after applying):
--   select column_name, column_default from information_schema.columns
--    where table_schema = 'public' and table_name = 'dive_manifests'
--      and column_name in ('verified', 'verified_at');
--   select policyname from pg_policies
--    where schemaname = 'public' and tablename = 'dive_manifests';
