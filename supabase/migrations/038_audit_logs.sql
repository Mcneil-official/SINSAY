-- 038_audit_logs.sql
-- Persistent audit trail replacing the dashboard's in-memory log.
-- staff_email is denormalized so entries survive staffer deactivation;
-- staff_id nulls on row delete (ON DELETE SET NULL). No UPDATE/DELETE:
-- history is append-only by design.
-- Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres), after 030.

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid references public.to_staff(id) on delete set null,
  staff_email text not null,
  action text not null,
  entity text,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

drop policy if exists "Staff can insert audit logs" on public.audit_logs;
create policy "Staff can insert audit logs"
  on public.audit_logs for insert with check (public.is_to_staff());
drop policy if exists "Staff can view audit logs" on public.audit_logs;
create policy "Staff can view audit logs"
  on public.audit_logs for select using (public.is_to_staff());

grant select, insert on public.audit_logs to authenticated;

-- Verification probes (run after applying):
--   select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'audit_logs'
--    order by ordinal_position;
--   select policyname, cmd from pg_policies
--    where schemaname = 'public' and tablename = 'audit_logs'
--    order by policyname;
