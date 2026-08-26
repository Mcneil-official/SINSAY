-- 021_manifest_fixes.sql
-- 1. Add captain_name to dive_manifests (inserted by step1.tsx, missing from initial schema)
alter table public.dive_manifests add column if not exists captain_name text;

-- 2. Add tourist_id to manifest_divers (needed by activation trigger 007)
alter table public.manifest_divers add column if not exists tourist_id uuid;

-- 3. Operator search RLS: approved operators can search tourists by name/ID for add-diver flow
create policy "Operators can search tourists"
  on public.tourists for select
  using (
    exists (
      select 1 from public.operator_applications
      where tourist_id = auth.uid() and status = 'approved'
    )
  );
