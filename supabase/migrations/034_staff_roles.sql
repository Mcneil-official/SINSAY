-- 034_staff_roles.sql
-- Two tiers: superadmin (full access, incl. users/roles/settings/pricing)
-- vs staff (operational queues + registries + announcements).
-- Idempotent: safe to re-run (drop-guarded policies, IF NOT EXISTS column).
-- Apply in Supabase SQL Editor (service role / postgres), after 030.

alter table public.to_staff
  add column if not exists role text not null default 'staff'
  check (role in ('staff', 'superadmin'));

-- Existing staff become superadmins. New rows default to staff (least
-- privilege); superadmins promote via Settings → Manage Users.
update public.to_staff set role = 'superadmin' where role = 'staff';

create or replace function public.is_to_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.to_staff
    where id = auth.uid() and is_active = true and role = 'superadmin'
  );
$$;

-- Pricing/config writes tighten from staff-wide to superadmin-only.
drop policy if exists "Staff can update pass pricing" on public.pass_pricing;
create policy "Staff can update pass pricing"
  on public.pass_pricing for update using (public.is_to_superadmin());
drop policy if exists "Staff can update payment config" on public.payment_config;
create policy "Staff can update payment config"
  on public.payment_config for update using (public.is_to_superadmin());

-- Staff roster management (superadmin CRUD; staff get no UPDATE path, so
-- self-promotion is impossible from the client).
drop policy if exists "Superadmin can view all staff" on public.to_staff;
create policy "Superadmin can view all staff"
  on public.to_staff for select using (public.is_to_superadmin());
drop policy if exists "Superadmin can update staff" on public.to_staff;
create policy "Superadmin can update staff"
  on public.to_staff for update using (public.is_to_superadmin());

grant update on public.to_staff to authenticated;

-- Inviting a new staffer (documented manual flow — auth users require the
-- service role, so the dashboard can't do this client-side):
--   1. Supabase Dashboard → Authentication → Users → Add user (auto-confirm),
--      then copy the UID.
--   2. insert into to_staff (id, email, full_name)
--      values ('<uid>', '<email>', '<name>');  -- role defaults to 'staff'

-- Verification probes (run after applying):
--   select id, email, role, is_active from public.to_staff;
--   select pg_get_functiondef('public.is_to_superadmin()'::regproc);
--   select tablename, policyname from pg_policies
--    where schemaname = 'public'
--      and tablename in ('to_staff', 'pass_pricing', 'payment_config')
--    order by 1, 2;
