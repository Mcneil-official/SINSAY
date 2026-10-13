-- 040_phase_a_writes.sql
-- Phase A ship-blockers: atomic writes + qty cap + ref uniqueness + walk-ins consume.
-- Idempotent / re-runnable in SQL Editor (per-statement commits).
-- Requires: 001 (tables/RLS), 020/023/027/039 (ledger), 022 (pricing/config).
-- Apply AFTER 039.
--
-- A1 (no client DELETE needed): two SECURITY DEFINER RPCs do multi-step
-- writes atomically, so partial writes never escape and no FOR DELETE RLS
-- is required (001 stays SELECT+INSERT-only for operators).
-- A5: CHECK total_passes 1-50 + UNIQUE(reference_number).
-- A6: walk-ins consume — ledger counts every manifest_divers row except
-- annually-covered registered divers (027 comment said "always consume"
-- but code made them free; this makes code match the comment).

-- ── A5a. Qty cap 1–50 ──
alter table public.dive_pass_inventory
  drop constraint if exists chk_total_passes_1_50;
alter table public.dive_pass_inventory
  add constraint chk_total_passes_1_50
  check (total_passes between 1 and 50);

-- ── A5b. Reference numbers: digits-only + unique ──
-- Normalizes legacy rows ("1002 9384 7561" -> "100293847561") before constraining.
update public.payment_transactions
set reference_number = regexp_replace(reference_number, '\D', '', 'g')
where reference_number ~ '\D';

alter table public.payment_transactions
  drop constraint if exists uq_payment_reference_number;
-- Fails loudly if true duplicates already exist (TO must dedupe first) —
-- that is intentional: silent double-spend is worse than a failed migration.
alter table public.payment_transactions
  add constraint uq_payment_reference_number unique (reference_number);

-- ── A6. Ledger: walk-ins consume ──
-- Same shape as 039; only manifests_consumed changes:
--   before: md.is_walk_in = false AND md.tourist_id IS NOT NULL AND not covered
--   after:  every diver row counts UNLESS it is a registered diver covered by
--           a valid annual holder for the dive date.
-- Walk-ins (tourist_id NULL) therefore consume 1 one-day pass each.
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
  left join manifest_divers md on md.manifest_id = dm.id
    and not exists (
      select 1 from annual_pass_holders h
      where h.tourist_id is not distinct from md.tourist_id
        and md.tourist_id is not null
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

-- ── A1. RPC: atomic buy-pass order ──
-- Client uploads the receipt to storage first (needs the path), then calls
-- this once. Either BOTH rows land or NEITHER does — no orphan cleanup.
create or replace function public.create_buy_pass_order(
  p_pass_type text,
  p_pass_label text,
  p_total_passes integer,
  p_amount numeric,
  p_reference_number text,
  p_receipt_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operator uuid := auth.uid();
  v_ref text;
  v_inventory_id uuid;
begin
  if v_operator is null then
    raise exception 'Not authenticated';
  end if;
  if p_pass_type not in ('single', 'multi', 'annual') then
    raise exception 'Invalid pass_type %', p_pass_type;
  end if;
  if p_total_passes is null or p_total_passes < 1 or p_total_passes > 50 then
    raise exception 'total_passes must be between 1 and 50';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  v_ref := regexp_replace(coalesce(p_reference_number, ''), '\D', '', 'g');
  if v_ref !~ '^\d{13}$' then
    raise exception 'reference_number must be 13 digits';
  end if;
  if p_receipt_path is null or p_receipt_path = '' then
    raise exception 'receipt path is required';
  end if;

  insert into public.dive_pass_inventory
    (operator_id, pass_type, pass_label, total_passes, remaining_passes, amount)
  values
    (v_operator, p_pass_type, coalesce(nullif(p_pass_label, ''), 'Dive Pass'),
     p_total_passes, p_total_passes, p_amount)
  returning id into v_inventory_id;

  insert into public.payment_transactions
    (operator_id, dive_pass_inventory_id, amount, reference_number, receipt_url, status)
  values
    (v_operator, v_inventory_id, p_amount, v_ref, p_receipt_path, 'pending');

  return v_inventory_id;
exception
  when unique_violation then
    raise exception 'This GCash reference number was already submitted';
end;
$$;

grant execute on function public.create_buy_pass_order(text, text, integer, numeric, text, text) to authenticated;

-- ── A1. RPC: atomic manifest + divers + annual holders ──
-- p_divers: jsonb array of {name, eco_id, tourist_id, is_walk_in}.
-- p_annual_assign: tourist_ids to anchor with 1-yr validity on p_dive_date.
-- Enforces dive_date >= today, capacity, and ledger balance server-side.
create or replace function public.create_manifest_with_divers(
  p_dive_type text,
  p_dive_mode text,
  p_location text,
  p_difficulty text,
  p_boat_name text,
  p_captain_name text,
  p_boat_contact text,
  p_crew_count integer,
  p_instructor_name text,
  p_max_divers integer,
  p_dive_date date,
  p_divers jsonb,
  p_annual_assign uuid[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operator uuid := auth.uid();
  v_manifest_id uuid;
  v_diver jsonb;
  v_count integer;
  v_needed integer := 0;
  v_remaining integer := 0;
  v_valid_until date;
  v_assign uuid;
begin
  if v_operator is null then
    raise exception 'Not authenticated';
  end if;
  if p_dive_date is null or p_dive_date < current_date then
    raise exception 'Dive date cannot be in the past';
  end if;
  if p_max_divers is null or p_max_divers < 1 then
    raise exception 'max_divers must be positive';
  end if;
  v_count := coalesce(jsonb_array_length(p_divers), 0);
  if v_count < 1 then
    raise exception 'At least one diver is required';
  end if;
  if v_count > p_max_divers then
    raise exception 'Divers (%) exceed max capacity (%)', v_count, p_max_divers;
  end if;
  if nullif(btrim(coalesce(p_boat_name, '')), '') is null then
    raise exception 'Boat name is required';
  end if;

  -- Balance check against the ledger (walk-ins always need a pass now).
  select coalesce(l.remaining_passes, 0) into v_remaining
  from public.operator_pass_ledger l
  where l.operator_id = v_operator;
  for v_diver in select * from jsonb_array_elements(p_divers) loop
    if coalesce((v_diver ->> 'is_walk_in')::boolean, false) then
      v_needed := v_needed + 1;
    elsif (v_diver ->> 'tourist_id') is not null
      and not (uuid(v_diver ->> 'tourist_id') = any (coalesce(p_annual_assign, '{}')))
      and not exists (
        select 1 from public.annual_pass_holders h
        where h.tourist_id = uuid(v_diver ->> 'tourist_id')
          and p_dive_date between h.valid_from and h.valid_until
      ) then
      v_needed := v_needed + 1;
    end if;
  end loop;
  if v_remaining < v_needed then
    raise exception 'Not enough dive passes: need %, have %', v_needed, v_remaining;
  end if;

  insert into public.dive_manifests
    (operator_id, dive_type, dive_mode, location, difficulty, boat_name,
     captain_name, boat_contact, crew_count, instructor_name,
     max_divers, duty_of_care, dive_date, status)
  values
    (v_operator, p_dive_type, p_dive_mode, p_location, p_difficulty,
     btrim(p_boat_name), nullif(btrim(coalesce(p_captain_name, '')), ''),
     nullif(btrim(coalesce(p_boat_contact, '')), ''), p_crew_count,
     nullif(btrim(coalesce(p_instructor_name, '')), ''),
     p_max_divers, true, p_dive_date, 'active')
  returning id into v_manifest_id;

  for v_diver in select * from jsonb_array_elements(p_divers) loop
    insert into public.manifest_divers
      (manifest_id, name, eco_id, tourist_id, is_walk_in)
    values
      (v_manifest_id,
       btrim(v_diver ->> 'name'),
       nullif(v_diver ->> 'eco_id', ''),
       nullif(v_diver ->> 'tourist_id', '')::uuid,
       coalesce((v_diver ->> 'is_walk_in')::boolean, false));
  end loop;

  -- Postgres clamps Feb-29 + 1 year to Feb-28, matching client addOneYear.
  v_valid_until := (p_dive_date + interval '1 year')::date;
  foreach v_assign in array coalesce(p_annual_assign, '{}') loop
    insert into public.annual_pass_holders
      (operator_id, tourist_id, valid_from, valid_until)
    values
      (v_operator, v_assign, p_dive_date, v_valid_until);
  end loop;

  return v_manifest_id;
end;
$$;

grant execute on function public.create_manifest_with_divers(
  text, text, text, text, text, text, text, integer, text, integer, date, jsonb, uuid[]
) to authenticated;

-- ── Probes (run after applying) ──
-- select conname from pg_constraint where conname in ('chk_total_passes_1_50','uq_payment_reference_number');
-- select * from public.operator_pass_ledger limit 5;
