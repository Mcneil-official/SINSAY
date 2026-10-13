-- 030_to_staff.sql
-- Dedicated TO staff accounts, separate from tourist accounts.
-- Single-role system: every active to_staff row is a superadmin with full
-- operational powers (verification queues + pricing/content). No role
-- column, no reviewer tier — add them later with a plain ALTER if the TO
-- ever needs delegation.
--
-- Bootstrap (SQL editor, service role): the staffer must first have an
-- auth.users row (Supabase Dashboard → Authentication → Users → Add user,
-- auto-confirm), then:
--   insert into public.to_staff (id, email, full_name)
--   values ('<auth-user-uuid>', '<email>', '<name>');
-- There is intentionally NO client-side insert: no public staff signup.
--
-- Idempotency: every CREATE POLICY is drop-guarded (the SQL editor commits
-- per statement — partial runs must converge on re-run, not collide).
-- Grants are explicit (never rely on platform defaults).
-- Apply in Supabase SQL Editor (service role / postgres).

create table if not exists public.to_staff (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

alter table public.to_staff enable row level security;

-- Staff can read their own row (needed at login).
drop policy if exists "Staff can view own staff row" on public.to_staff;
create policy "Staff can view own staff row"
  on public.to_staff for select
  using (auth.uid() = id);

grant select on public.to_staff to authenticated;

-- Helper: true for any active staff row. Security definer so policies can
-- call it regardless of the caller's row access.
create or replace function public.is_to_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.to_staff
    where id = auth.uid() and is_active = true
  );
$$;

-- Staff SELECT on every operational table (queues, records, analytics).
drop policy if exists "Staff can view all tourists" on public.tourists;
create policy "Staff can view all tourists"
  on public.tourists for select using (public.is_to_staff());
drop policy if exists "Staff can view all eco-dive IDs" on public.eco_dive_ids;
create policy "Staff can view all eco-dive IDs"
  on public.eco_dive_ids for select using (public.is_to_staff());
drop policy if exists "Staff can view all operator applications" on public.operator_applications;
create policy "Staff can view all operator applications"
  on public.operator_applications for select using (public.is_to_staff());
drop policy if exists "Staff can view all pass inventory" on public.dive_pass_inventory;
create policy "Staff can view all pass inventory"
  on public.dive_pass_inventory for select using (public.is_to_staff());
drop policy if exists "Staff can view all payment transactions" on public.payment_transactions;
create policy "Staff can view all payment transactions"
  on public.payment_transactions for select using (public.is_to_staff());
drop policy if exists "Staff can view all dive manifests" on public.dive_manifests;
create policy "Staff can view all dive manifests"
  on public.dive_manifests for select using (public.is_to_staff());
drop policy if exists "Staff can view all manifest divers" on public.manifest_divers;
create policy "Staff can view all manifest divers"
  on public.manifest_divers for select using (public.is_to_staff());
drop policy if exists "Staff can view all annual holders" on public.annual_pass_holders;
create policy "Staff can view all annual holders"
  on public.annual_pass_holders for select using (public.is_to_staff());

grant select on public.tourists to authenticated;
grant select on public.eco_dive_ids to authenticated;
grant select on public.operator_applications to authenticated;
grant select on public.dive_pass_inventory to authenticated;
grant select on public.payment_transactions to authenticated;
grant select on public.dive_manifests to authenticated;
grant select on public.manifest_divers to authenticated;
grant select on public.annual_pass_holders to authenticated;

-- Staff verification writes: application + payment statuses.
drop policy if exists "Staff can update operator applications" on public.operator_applications;
create policy "Staff can update operator applications"
  on public.operator_applications for update using (public.is_to_staff());
drop policy if exists "Staff can update payment transactions" on public.payment_transactions;
create policy "Staff can update payment transactions"
  on public.payment_transactions for update using (public.is_to_staff());

grant update on public.operator_applications to authenticated;
grant update on public.payment_transactions to authenticated;

-- Staff pricing/config writes (TO-managed tables, operators read-only).
drop policy if exists "Staff can update pass pricing" on public.pass_pricing;
create policy "Staff can update pass pricing"
  on public.pass_pricing for update using (public.is_to_staff());
drop policy if exists "Staff can insert pass pricing" on public.pass_pricing;
create policy "Staff can insert pass pricing"
  on public.pass_pricing for insert with check (public.is_to_staff());
drop policy if exists "Staff can update payment config" on public.payment_config;
create policy "Staff can update payment config"
  on public.payment_config for update using (public.is_to_staff());

grant update on public.pass_pricing to authenticated;
grant insert on public.pass_pricing to authenticated;
grant update on public.payment_config to authenticated;

-- Rejection reason for payment verification (mirrors operator_applications
-- rejection_reason from 023 — the dashboard collects a reason on reject).
alter table public.payment_transactions
  add column if not exists rejection_reason text;

-- Staff can read uploaded receipts/documents for verification (both
-- buckets, any uploader — path layout is <folder>/<uid>/<file>).
drop policy if exists "Staff can read all operator files" on storage.objects;
create policy "Staff can read all operator files"
  on storage.objects for select
  using (
    bucket_id = 'operator_uploads' and public.is_to_staff()
  );
drop policy if exists "Staff can read all tourist files" on storage.objects;
create policy "Staff can read all tourist files"
  on storage.objects for select
  using (
    bucket_id = 'tourist_uploads' and public.is_to_staff()
  );

-- Verification probes (run after applying):
--   select pg_get_functiondef('public.is_to_staff()'::regproc);
--   select count(*) from pg_policies
--    where schemaname in ('public', 'storage') and policyname like 'Staff%';
--   select id, email, full_name, is_active from public.to_staff;
