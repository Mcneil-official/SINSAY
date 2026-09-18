-- 027_annual_holders.sql
-- Annual dive passes: per-diver yearly validity, checked at manifest time.
-- Model: operators buy annual SLOTS (normal inventory rows with
-- pass_type='annual', same payment flow); at manifest time they assign slots
-- to registered divers, creating holder rows anchored on the dive date.
-- The ledger (below) excludes annually-covered divers from consumption
-- server-side — no client-set flag, so operators can't self-exempt divers.
-- Walk-ins (no tourist_id) can never hold annuals and always consume
-- one-day passes... (they are currently free: the ledger only counts
-- is_walk_in = false divers, unchanged).
-- Apply in Supabase SQL Editor (service role / postgres).

-- 1. Annual inventory rows: widen pass_type.
alter table public.dive_pass_inventory
  drop constraint if exists dive_pass_inventory_pass_type_check;
alter table public.dive_pass_inventory
  add constraint dive_pass_inventory_pass_type_check
  check (pass_type in ('single', 'multi', 'annual'));

-- 2. Holder rows: one per diver per annual assignment.
create table if not exists public.annual_pass_holders (
  id uuid default gen_random_uuid() primary key,
  operator_id uuid not null,
  tourist_id uuid not null references public.tourists(id) on delete cascade,
  valid_from date not null,
  valid_until date not null,
  created_at timestamptz default now(),
  constraint annual_valid_range check (valid_until >= valid_from)
);

alter table public.annual_pass_holders enable row level security;

-- Operators manage their own assignments.
create policy "Operators manage own annual holders"
  on public.annual_pass_holders for all
  using (auth.uid() = operator_id)
  with check (auth.uid() = operator_id);

-- Any approved operator can check coverage (a diver's annual is valid
-- regardless of which operator sold it) — mirrors the 003/021 search policies.
create policy "Approved operators can view all annual holders"
  on public.annual_pass_holders for select
  using (
    exists (
      select 1 from public.operator_applications
      where tourist_id = auth.uid() and status = 'approved'
    )
  );

-- Tourists can see their own validity.
create policy "Tourists can view own annual holders"
  on public.annual_pass_holders for select
  using (auth.uid() = tourist_id);

-- 3. Ledger: exclude annual inventory from one-day purchases, exclude
-- annually-covered divers from consumption, and expose slot accounting.
create or replace view public.operator_pass_ledger as
with verified_purchases as (
  select dpi.operator_id, coalesce(sum(dpi.total_passes), 0) as purchased_passes
  from dive_pass_inventory dpi
  inner join payment_transactions pt on pt.dive_pass_inventory_id = dpi.id
  where pt.status = 'verified' and dpi.pass_type != 'annual'
  group by dpi.operator_id
),
verified_annual as (
  select dpi.operator_id, coalesce(sum(dpi.total_passes), 0) as annual_purchased
  from dive_pass_inventory dpi
  inner join payment_transactions pt on pt.dive_pass_inventory_id = dpi.id
  where pt.status = 'verified' and dpi.pass_type = 'annual'
  group by dpi.operator_id
),
annual_assigned as (
  select operator_id, count(id) as annual_assigned
  from annual_pass_holders
  group by operator_id
),
manifests_consumed as (
  select dm.operator_id, count(md.id) as consumed_passes
  from dive_manifests dm
  left join manifest_divers md on md.manifest_id = dm.id and md.is_walk_in = false
    and md.tourist_id is not null
    and not exists (
      select 1 from annual_pass_holders h
      where h.tourist_id = md.tourist_id
        and dm.dive_date between h.valid_from and h.valid_until
    )
  group by dm.operator_id
)
select
  coalesce(vp.operator_id, mc.operator_id, va.operator_id, aa.operator_id) as operator_id,
  coalesce(vp.purchased_passes, 0) as purchased_passes,
  coalesce(mc.consumed_passes, 0) as consumed_passes,
  coalesce(vp.purchased_passes, 0) - coalesce(mc.consumed_passes, 0) as remaining_passes,
  coalesce(va.annual_purchased, 0) as annual_purchased,
  coalesce(aa.annual_assigned, 0) as annual_assigned,
  coalesce(va.annual_purchased, 0) - coalesce(aa.annual_assigned, 0) as annual_remaining
from verified_purchases vp
full outer join manifests_consumed mc on mc.operator_id = vp.operator_id
full outer join verified_annual va on va.operator_id = coalesce(vp.operator_id, mc.operator_id)
full outer join annual_assigned aa on aa.operator_id = coalesce(vp.operator_id, mc.operator_id, va.operator_id);

alter view public.operator_pass_ledger set (security_invoker = true);
grant select on public.operator_pass_ledger to authenticated;
