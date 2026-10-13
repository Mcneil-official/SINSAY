-- 035_establishment_staff_rls.sql
-- Restrict establishment writes to TO staff. The pre-existing policies
-- allowed ANY authenticated user (including tourists/operators) to
-- insert/update/delete. Reads untouched: public keeps accredited=true,
-- staff keep full SELECT via 030. No DELETE change (dashboard offers no
-- establishment delete, matching the dive-sites convention).
--
-- No new columns: suspend/reactivate reuse the accredited boolean
-- (false = Suspended, which also hides the row from public reads by
-- design), and permit fields belong to a future permit-management scope.
-- Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres).

drop policy if exists "TO staff insert establishments" on public.establishments;
create policy "TO staff insert establishments"
  on public.establishments for insert with check (public.is_to_staff());
drop policy if exists "TO staff update establishments" on public.establishments;
create policy "TO staff update establishments"
  on public.establishments for update using (public.is_to_staff());

-- Staff read-all (the original table shipped without one, which broke more
-- than suspend: PostgREST re-checks SELECT policies on the post-UPDATE row,
-- so flipping accredited=false failed the write itself ("new row violates
-- row-level security"), suspended rows were invisible in listings, and
-- reactivate failed the same way. Public reads stay accredited-only.)
drop policy if exists "TO staff read establishments" on public.establishments;
create policy "TO staff read establishments"
  on public.establishments for select using (public.is_to_staff());

-- Realtime push for the Establishments tab (optional; without it the
-- dashboard falls back to 30s stale + post-write refetch). "Already a
-- member" means push is already on — skip in that case.
alter publication supabase_realtime add table public.establishments;

-- Verification probes (run after applying):
--   select policyname, cmd, roles from pg_policies
--    where schemaname = 'public' and tablename = 'establishments'
--    order by policyname;
--
-- Expected: "Anyone can read accredited establishments" (SELECT),
-- "TO staff read establishments" (SELECT),
-- "TO staff insert establishments" (INSERT), "TO staff update
-- establishments" (UPDATE), "TO staff delete establishments" (DELETE,
-- pre-existing, unchanged).
