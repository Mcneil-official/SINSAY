-- 041_phase_b_annual.sql
-- Phase B annual hardening: overlap guard + manifest link + exact 1-yr +
-- consumable slots + robust ledger + stats RPC + manifest RPC hardening.
-- Idempotent / re-runnable in SQL Editor (per-statement commits).
-- Requires: 027 (holders), 039 (exact-dup index), 040 (RPCs + ledger).
-- Apply AFTER 040.
--
-- Decisions locked: overlap = trigger (no btree_gist needed),
-- validity = exact 1-year anchor, cross-operator coverage stays GLOBAL,
-- annual slots = CONSUMABLE (deducted after use, never returned).

-- ── B2a. Manifest link: which manifest spent the slot ──
-- SET NULL on manifest delete: the slot stays spent (consumable) but the
-- audit pointer clears instead of blocking the delete.
alter table public.annual_pass_holders
  add column if not exists manifest_id uuid references public.dive_manifests(id) on delete set null;
create index if not exists annual_holders_manifest_idx
  on public.annual_pass_holders (manifest_id);

-- ── B2b. Exact 1-year validity ──
-- Every holder must be exactly dive_date + 1 year (PG clamps Feb-29 to
-- Feb-28, matching client addOneYear + RPC computation). Direct RLS inserts
-- can no longer create 10-year ranges.
alter table public.annual_pass_holders
  drop constraint if exists chk_annual_exact_one_year;
alter table public.annual_pass_holders
  add constraint chk_annual_exact_one_year
  check (valid_until = (valid_from + interval '1 year')::date);

-- ── B1. Overlap guard: one tourist, one active range at a time ──
-- Exact-dup index (039) only blocks byte-identical rows; this blocks partial
-- overlaps (2026-01-01→2027-01-01 + 2026-06-01→2027-06-01) that would burn
-- 2 slots for 1 person. Trigger (not exclusion constraint): no extension.
create or replace function public.no_overlapping_annual_holder()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.annual_pass_holders h
    where h.tourist_id = new.tourist_id
      and h.id is distinct from new.id
      and daterange(h.valid_from, h.valid_until, '[]')
        && daterange(new.valid_from, new.valid_until, '[]')
  ) then
    raise exception 'Tourist already holds an annual pass overlapping %–%', new.valid_from, new.valid_until;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_no_overlapping_annual on public.annual_pass_holders;
create trigger trg_no_overlapping_annual
  before insert or update on public.annual_pass_holders
  for each row execute function public.no_overlapping_annual_holder();

-- ── B3+B4. Ledger rewrite: canonical operator list + consumable annuals ──
-- UNION operator list (not FULL OUTER JOIN chain): order-proof, and an
-- operator present in any CTE always yields exactly one row.
-- Consumable: annual_assigned counts ALL holder rows ever (no valid_until
-- filter) — expired slots do NOT free up. Walk-ins consume (040 A6 kept).
-- remaining floors at 0 so one overspent row can't render negative.
-- Coverage stays GLOBAL: any operator's holder covers any diver (027:39-40).
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
  left join manifest_divers md on md.manifest_id = dm.id
    and not exists (
      select 1 from annual_pass_holders h
      where h.tourist_id is not distinct from md.tourist_id
        and md.tourist_id is not null
        and dm.dive_date between h.valid_from and h.valid_until
    )
  group by dm.operator_id
),
all_ops as (
  select operator_id from verified_purchases
  union
  select operator_id from manifests_consumed
  union
  select operator_id from verified_annual
  union
  select operator_id from annual_assigned
)
select
  o.operator_id,
  coalesce(vp.purchased_passes, 0) as purchased_passes,
  coalesce(mc.consumed_passes, 0) as consumed_passes,
  greatest(coalesce(vp.purchased_passes, 0) - coalesce(mc.consumed_passes, 0), 0) as remaining_passes,
  coalesce(va.annual_purchased, 0) as annual_purchased,
  coalesce(aa.annual_assigned, 0) as annual_assigned,
  greatest(coalesce(va.annual_purchased, 0) - coalesce(aa.annual_assigned, 0), 0) as annual_remaining
from all_ops o
left join verified_purchases vp on vp.operator_id = o.operator_id
left join manifests_consumed mc on mc.operator_id = o.operator_id
left join verified_annual va on va.operator_id = o.operator_id
left join annual_assigned aa on aa.operator_id = o.operator_id;

alter view public.operator_pass_ledger set (security_invoker = true);
grant select on public.operator_pass_ledger to authenticated;

-- ── B4. Stats RPC: one round-trip for the operator dashboard ──
-- Replaces 6 sequential trips + N+1 per-manifest counts. Week is
-- Sunday-based (Sunday=0) to match the client it replaces.
create or replace function public.get_operator_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operator uuid := auth.uid();
  v_today date := current_date;
  v_yesterday date := current_date - 1;
  v_week_start date := current_date - extract(dow from current_date)::integer;
  v_week_end date := v_week_start + 6;
  v_today_divers integer := 0;
  v_yesterday_divers integer := 0;
  v_week_count integer := 0;
  v_remaining integer := 0;
  v_purchased integer := 0;
  v_annual_remaining integer := 0;
  v_annual_purchased integer := 0;
  v_recent jsonb := '[]'::jsonb;
begin
  if v_operator is null then
    raise exception 'Not authenticated';
  end if;

  select count(md.id) into v_today_divers
  from dive_manifests dm
  left join manifest_divers md on md.manifest_id = dm.id
  where dm.operator_id = v_operator and dm.dive_date = v_today;

  select count(md.id) into v_yesterday_divers
  from dive_manifests dm
  left join manifest_divers md on md.manifest_id = dm.id
  where dm.operator_id = v_operator and dm.dive_date = v_yesterday;

  select count(*) into v_week_count
  from dive_manifests dm
  where dm.operator_id = v_operator
    and dm.dive_date between v_week_start and v_week_end;

  select
    coalesce(l.remaining_passes, 0),
    coalesce(l.purchased_passes, 0),
    coalesce(l.annual_remaining, 0),
    coalesce(l.annual_purchased, 0)
  into v_remaining, v_purchased, v_annual_remaining, v_annual_purchased
  from public.operator_pass_ledger l
  where l.operator_id = v_operator;

  select coalesce(jsonb_agg(t order by t.dive_date desc), '[]'::jsonb) into v_recent
  from (
    select dm.id, dm.boat_name, dm.location, dm.dive_date,
           count(md.id) as diver_count
    from dive_manifests dm
    left join manifest_divers md on md.manifest_id = dm.id
    where dm.operator_id = v_operator
    group by dm.id, dm.boat_name, dm.location, dm.dive_date
    order by dm.dive_date desc
    limit 10
  ) t;

  return jsonb_build_object(
    'today_divers', v_today_divers,
    'yesterday_divers', v_yesterday_divers,
    'week_count', v_week_count,
    'remaining_passes', v_remaining,
    'purchased_passes', v_purchased,
    'annual_remaining', v_annual_remaining,
    'annual_purchased', v_annual_purchased,
    'recent_manifests', v_recent
  );
end;
$$;

grant execute on function public.get_operator_stats() to authenticated;

-- ── B1+B2+B4. Harden create_manifest_with_divers ──
-- Changes vs 040: advisory lock (no concurrent overspend), v_needed counts
-- ANY non-covered row (closes {tourist_id:null,is_walk_in:false} free hole),
-- assign ⊆ divers + existence + not-already-covered checks, annual balance
-- check, holders carry manifest_id, returns {manifest_id, remaining} so the
-- confirmation screen never uses a stale client-computed balance.
-- Return type changes uuid -> jsonb: DROP first (OR REPLACE cannot do that).
drop function if exists public.create_manifest_with_divers(
  text, text, text, text, text, text, text, integer, text, integer, date, jsonb, uuid[]
);

create function public.create_manifest_with_divers(
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
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operator uuid := auth.uid();
  v_manifest_id uuid;
  v_diver jsonb;
  v_diver_name text;
  v_diver_tourist text;
  v_count integer;
  v_needed integer := 0;
  v_remaining integer := 0;
  v_annual_remaining integer := 0;
  v_new_assign integer := 0;
  v_valid_until date;
  v_assign uuid;
  v_member boolean;
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

  -- Serialize concurrent submits per operator: the balance reads below must
  -- not race (TOCTOU overspend). Xact-scoped: auto-released on commit.
  perform pg_advisory_xact_lock(hashtext('manifest:' || v_operator::text));

  -- Validate every diver row with clean errors (no raw PG cast failures).
  for v_diver in select * from jsonb_array_elements(p_divers) loop
    v_diver_name := btrim(coalesce(v_diver ->> 'name', ''));
    if v_diver_name = '' then
      raise exception 'Every diver needs a name';
    end if;
    v_diver_tourist := nullif(v_diver ->> 'tourist_id', '');
    if v_diver_tourist is not null then
      begin
        perform v_diver_tourist::uuid;
      exception when invalid_text_representation then
        raise exception 'Invalid tourist id for diver %', v_diver_name;
      end;
    end if;
  end loop;

  -- Assignment guard: every assignee must be on this manifest, exist, and
  -- not already be covered on the dive date (else the slot burns for nothing).
  foreach v_assign in array coalesce(p_annual_assign, '{}') loop
    select exists (
      select 1 from jsonb_array_elements(p_divers) d
      where nullif(d ->> 'tourist_id', '') = v_assign::text
    ) into v_member;
    if not coalesce(v_member, false) then
      raise exception 'Annual assignee % is not on this manifest', v_assign;
    end if;
    if not exists (select 1 from public.tourists t where t.id = v_assign) then
      raise exception 'Unknown tourist %', v_assign;
    end if;
    if exists (
      select 1 from public.annual_pass_holders h
      where h.tourist_id = v_assign
        and p_dive_date between h.valid_from and h.valid_until
    ) then
      raise exception 'Tourist % is already covered by an annual pass for this date', v_assign;
    end if;
  end loop;
  v_new_assign := coalesce(array_length(p_annual_assign, 1), 0);

  -- Balances (one-day + annual slots; slots are consumable, never return).
  select coalesce(l.remaining_passes, 0), coalesce(l.annual_remaining, 0)
  into v_remaining, v_annual_remaining
  from public.operator_pass_ledger l
  where l.operator_id = v_operator;
  if v_annual_remaining < v_new_assign then
    raise exception 'Not enough annual slots: need %, have %', v_new_assign, v_annual_remaining;
  end if;

  -- Consumption: walk-ins always need a pass; any other non-covered row
  -- needs one too (matches the ledger, which consumes every row except
  -- annually-covered registered divers — no free hole for malformed rows).
  for v_diver in select * from jsonb_array_elements(p_divers) loop
    if coalesce((v_diver ->> 'is_walk_in')::boolean, false) then
      v_needed := v_needed + 1;
    elsif nullif(v_diver ->> 'tourist_id', '') is null then
      v_needed := v_needed + 1;
    elsif not (nullif(v_diver ->> 'tourist_id', '')::uuid = any (coalesce(p_annual_assign, '{}')))
      and not exists (
        select 1 from public.annual_pass_holders h
        where h.tourist_id = nullif(v_diver ->> 'tourist_id', '')::uuid
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

  -- Exact 1-year anchor (Feb-29 clamps to Feb-28, matching client addOneYear).
  -- Overlap trigger is the backstop; the assign guard above fails first
  -- with a readable message.
  v_valid_until := (p_dive_date + interval '1 year')::date;
  foreach v_assign in array coalesce(p_annual_assign, '{}') loop
    insert into public.annual_pass_holders
      (operator_id, tourist_id, valid_from, valid_until, manifest_id)
    values
      (v_operator, v_assign, p_dive_date, v_valid_until, v_manifest_id);
  end loop;

  -- Fresh post-write balance (same transaction sees the new rows).
  select coalesce(l.remaining_passes, 0)
  into v_remaining
  from public.operator_pass_ledger l
  where l.operator_id = v_operator;

  return jsonb_build_object('manifest_id', v_manifest_id, 'remaining', v_remaining);
end;
$$;

grant execute on function public.create_manifest_with_divers(
  text, text, text, text, text, text, text, integer, text, integer, date, jsonb, uuid[]
) to authenticated;

-- ── Probes (run after applying) ──
-- select column_name from information_schema.columns where table_name = 'annual_pass_holders';
-- select conname from pg_constraint where conname in ('chk_annual_exact_one_year');
-- select tgname from pg_trigger where tgname = 'trg_no_overlapping_annual';
-- select * from public.operator_pass_ledger limit 5;
