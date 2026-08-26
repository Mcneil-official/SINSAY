-- 020_pass_ledger_dive_date.sql
-- 1. Add dive_date column to dive_manifests for deriving Active/Done status
alter table public.dive_manifests add column if not exists dive_date date not null default CURRENT_DATE;
update public.dive_manifests set dive_date = created_at::date where dive_date is null;

-- 2. Create pass ledger view: remaining = verified purchases − consumed via manifests
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
  left join manifest_divers md on md.manifest_id = dm.id
  group by dm.operator_id
)
select
  coalesce(vp.operator_id, mc.operator_id) as operator_id,
  coalesce(vp.purchased_passes, 0) as purchased_passes,
  coalesce(mc.consumed_passes, 0) as consumed_passes,
  coalesce(vp.purchased_passes, 0) - coalesce(mc.consumed_passes, 0) as remaining_passes
from verified_purchases vp
full outer join manifests_consumed mc on mc.operator_id = vp.operator_id;

-- RLS: operator sees only their own ledger row
alter table public.operator_pass_ledger enable row level security;
create policy "Operators see own ledger"
  on public.operator_pass_ledger for select
  using (auth.uid() = operator_id);
