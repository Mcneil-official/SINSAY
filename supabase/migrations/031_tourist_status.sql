-- 031_tourist_status.sql
-- Adds operator-intent status for the dashboard tourist registry + staff
-- update access. Expiry stays derived client-side (renewal_date < today).
-- Idempotent: safe to re-run (drop-guarded policy, IF NOT EXISTS column).
-- Apply in Supabase SQL Editor (service role / postgres), after 030.

alter table public.tourists
  add column if not exists status text not null default 'Active'
  check (status in ('Active', 'Expired', 'Suspended'));

drop policy if exists "Staff can update tourists" on public.tourists;
create policy "Staff can update tourists"
  on public.tourists for update using (public.is_to_staff());

grant update on public.tourists to authenticated;

-- Realtime push for the Tourists tab (optional; without it the dashboard
-- falls back to 30s stale + post-write refetch). Errors with "already a
-- member" mean push is already on — skip in that case.
alter publication supabase_realtime add table public.tourists;

-- Verification probes (run after applying):
--   select column_name, column_default from information_schema.columns
--    where table_schema = 'public' and table_name = 'tourists'
--      and column_name = 'status';
--   select policyname from pg_policies
--    where schemaname = 'public' and tablename = 'tourists';
