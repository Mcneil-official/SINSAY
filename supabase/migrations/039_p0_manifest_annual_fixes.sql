-- 039_p0_manifest_annual_fixes.sql
-- P0 manifest + annual hardening. 031-038 live in-repo (dashboard-origin);
-- this file starts after 038 and must not collide with them (audit: none of
-- 031-038 touch activate_eco_dive_ids, operator_pass_ledger, or
-- annual_pass_holders indexes).
-- Idempotent: re-runnable in SQL Editor (per-statement commits).
-- Requires: 007 (trigger), 020/023/027 (ledger), 027 (annual_pass_holders).
-- Apply in Supabase SQL Editor (service role / postgres), AFTER 038.

-- ── 1. Activation trigger: search_path + notify-only-on-change + correct link ──
-- Preserves 007 statement-level REFERENCING NEW TABLE pattern and 032
-- separation (never writes tourists.status or dive_manifests.verified).
create or replace function public.activate_eco_dive_ids()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  v_updated int;
begin
  for rec in
    select distinct md.tourist_id, md.manifest_id
    from public.manifest_divers md
    where md.manifest_id in (select distinct manifest_id from new_table)
      and md.tourist_id is not null
      and not md.is_walk_in
  loop
    update public.eco_dive_ids
    set status = 'active',
        updated_at = now(),
        activated_at = now(),
        activated_by_manifest_id = rec.manifest_id
    where tourist_id = rec.tourist_id
      and status is distinct from 'active';

    get diagnostics v_updated = row_count;

    if v_updated > 0 then
      insert into public.notifications (tourist_id, type, title, body, deep_link)
      values (
        rec.tourist_id,
        'eco_dive_activated',
        'Eco-Dive ID Activated',
        'Your Eco-Dive ID has been activated! You are now part of a Dive Manifesto in Mabini.',
        '/(tabs)/eco-dive-id'
      );
    end if;
  end loop;

  return null;
end;
$$;

drop trigger if exists after_manifest_divers_insert_activate on public.manifest_divers;
create trigger after_manifest_divers_insert_activate
  after insert on public.manifest_divers
  referencing new table as new_table
  for each statement
  execute function public.activate_eco_dive_ids();

-- ── 2. Annual double-assign guard (exact duplicates) + coverage lookup index ──
-- Exact-dup unique only; overlapping ranges still need app-level check
-- (btree_gist exclusion deferred — needs extension approval).
-- Name is novel: no clash with 023 idx_operator_apps_one_active.
create unique index if not exists annual_holders_no_exact_dup
  on public.annual_pass_holders (tourist_id, valid_from, valid_until);
create index if not exists annual_holders_coverage_idx
  on public.annual_pass_holders (tourist_id, valid_from, valid_until);

-- ── 3. Ledger: annual slots expire (only valid_until >= today occupies a slot) ──
-- Mirrors 027 shape; single change in annual_assigned CTE. Consumption
-- exclusion stays GLOBAL (any operator's holder covers — matches 027:39-40).
-- Walk-in exclusion preserved (023:29). Expiry derived from dates, not 031 status.
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
  where valid_until >= current_date
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

-- Re-apply after every CREATE OR REPLACE (020:35 / 023:40 / 027:102 pattern).
alter view public.operator_pass_ledger set (security_invoker = true);
grant select on public.operator_pass_ledger to authenticated;

-- ── 4. Realtime (guarded — bare ADD TABLE fails on re-run) ──
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public'
      and tablename = 'annual_pass_holders'
  ) then
    alter publication supabase_realtime add table public.annual_pass_holders;
  end if;
end
$$;

-- ── Probes (run after applying) ──
-- select pg_get_functiondef('public.activate_eco_dive_ids()'::regproc);
-- select indexname from pg_indexes where tablename = 'annual_pass_holders';
-- select * from public.operator_pass_ledger limit 5;
