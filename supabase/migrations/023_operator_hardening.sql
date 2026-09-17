-- 023_operator_hardening.sql
-- P2 operator hardening: dedupe guard, rejection reason, ledger walk-in fix.
-- Apply in Supabase SQL Editor (service role / postgres).

-- 1. Prevent duplicate active applications: at most one pending OR approved
-- per tourist. Rejected rows remain insertable so users can re-apply.
create unique index if not exists idx_operator_apps_one_active
  on public.operator_applications (tourist_id)
  where status in ('pending', 'approved');

-- 2. Rejection reason for full rejection UX (tourist profile + resubmit form).
alter table public.operator_applications
  add column if not exists rejection_reason text;

-- 3. Ledger must not consume passes for walk-in divers.
-- views cannot be ALTERed in place for the query body, so re-create then
-- re-apply the security_invoker + grant from 020.
create or replace view public.operator_pass_ledger as
with verified_purchases as (
  select dpi.operator_id, coalesce(sum(dpi.total_passes), 0) as purchased_passes
  from dive_pass_inventory dpi
  inner join payment_transactions pt on pt.dive_pass_inventory_id = dpi.id
  where pt.status = 'verified'
  group by dpi.operator_id
),
manifests_consumed as (
  select dm.operator_id, count(md.id) as consumed_passes
  from dive_manifests dm
  left join manifest_divers md on md.manifest_id = dm.id and md.is_walk_in = false
  group by dm.operator_id
)
select
  coalesce(vp.operator_id, mc.operator_id) as operator_id,
  coalesce(vp.purchased_passes, 0) as purchased_passes,
  coalesce(mc.consumed_passes, 0) as consumed_passes,
  coalesce(vp.purchased_passes, 0) - coalesce(mc.consumed_passes, 0) as remaining_passes
from verified_purchases vp
full outer join manifests_consumed mc on mc.operator_id = vp.operator_id;

alter view public.operator_pass_ledger set (security_invoker = true);
grant select on public.operator_pass_ledger to authenticated;
