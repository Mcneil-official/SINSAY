-- ============================================
-- SINSAY Migration 062 — Auto-Create Eco-Dive ID on Registration
-- ============================================
--
-- Ensures every tourist receives a unique Eco-Dive ID number (e.g. ECO-2026-100001)
-- immediately upon account creation in auth.users.
--
-- Also backfills any existing tourist accounts lacking an eco_dive_ids record,
-- and hardens create_manifest_with_divers to pull the tourist's eco_id_number
-- if the client omitted it.

-- 1. Create sequence for sequential, collision-free 6-digit Eco-Dive ID numbering
create sequence if not exists public.eco_id_seq start with 100001;

-- 2. Upgrade handle_new_user() to create both tourist profile AND eco_dive_ids
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eco_number text;
begin
  -- Insert tourist profile
  insert into public.tourists (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );

  -- Generate unique Eco-Dive ID: ECO-YYYY-NNNNNN
  v_eco_number := 'ECO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.eco_id_seq')::text, 6, '0');

  -- Auto-provision eco_dive_ids row on registration
  insert into public.eco_dive_ids (tourist_id, eco_id_number, status)
  values (new.id, v_eco_number, 'incomplete')
  on conflict (tourist_id) do nothing;

  return new;
end;
$$;

-- 3. One-time backfill: auto-provision eco_dive_ids for all existing registered tourists
insert into public.eco_dive_ids (tourist_id, eco_id_number, status)
select
  t.id,
  'ECO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.eco_id_seq')::text, 6, '0'),
  'incomplete'
from public.tourists t
left join public.eco_dive_ids e on e.tourist_id = t.id
where e.id is null
on conflict (tourist_id) do nothing;

-- 4. Harden create_manifest_with_divers to ensure manifest_divers.eco_id
-- is never null when a tourist_id is present
create or replace function public.create_manifest_with_divers(
  p_dive_type text,
  p_dive_mode text,
  p_location text,
  p_difficulty text,
  p_boat_name text default null,
  p_captain_name text default null,
  p_boat_contact text default null,
  p_crew_count integer default null,
  p_instructor_name text default null,
  p_max_divers integer default 16,
  p_dive_date date default current_date,
  p_divers jsonb default '[]'::jsonb,
  p_annual_assign uuid[] default '{}'::uuid[],
  p_duty_notes text default null,
  p_crew_members text[] default '{}'::text[],
  p_dive_masters text[] default '{}'::text[]
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operator uuid;
  v_manifest_id uuid;
  v_diver jsonb;
  v_needed integer := 0;
  v_remaining integer;
  v_annual_remaining integer;
  v_assign uuid;
  v_valid_until date;
  v_diver_count integer;
  v_new_assign integer;
  v_effective_crew_count integer;
  v_effective_instructor text;
  v_resolved_eco_id text;
begin
  v_operator := auth.uid();
  if v_operator is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.operator_applications oa
    where oa.tourist_id = v_operator and oa.status = 'approved'
  ) then
    raise exception 'Operator not approved';
  end if;

  if p_dive_date < current_date then
    raise exception 'Dive date cannot be in the past';
  end if;

  if p_dive_mode = 'Boat Dive' and (p_boat_name is null or btrim(p_boat_name) = '') then
    raise exception 'Boat name required for boat dives';
  end if;

  if p_crew_members is not null and array_length(p_crew_members, 1) > 0 then
    v_effective_crew_count := array_length(p_crew_members, 1);
  else
    v_effective_crew_count := p_crew_count;
  end if;

  if p_dive_masters is not null and array_length(p_dive_masters, 1) > 0 then
    v_effective_instructor := p_dive_masters[1];
  else
    v_effective_instructor := nullif(btrim(coalesce(p_instructor_name, '')), '');
  end if;

  v_diver_count := coalesce(jsonb_array_length(p_divers), 0);
  if v_diver_count = 0 then
    raise exception 'At least one diver is required';
  end if;

  if p_max_divers is not null and v_diver_count > p_max_divers then
    raise exception 'Diver count (%) exceeds maximum capacity (%)', v_diver_count, p_max_divers;
  end if;

  foreach v_assign in array coalesce(p_annual_assign, '{}') loop
    if not exists (
      select 1 from jsonb_array_elements(p_divers) d
      where nullif(d ->> 'tourist_id', '')::uuid = v_assign
        and not coalesce((d ->> 'is_walk_in')::boolean, false)
    ) then
      raise exception 'Annual pass assignee % is not on the manifest', v_assign;
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

  select coalesce(l.remaining_passes, 0), coalesce(l.annual_remaining, 0)
  into v_remaining, v_annual_remaining
  from public.operator_pass_ledger l
  where l.operator_id = v_operator;
  if v_annual_remaining < v_new_assign then
    raise exception 'Not enough annual slots: need %, have %', v_new_assign, v_annual_remaining;
  end if;

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
     max_divers, duty_of_care, duty_of_care_notes, dive_date, status,
     crew_members, dive_masters)
  values
    (v_operator, p_dive_type, p_dive_mode, p_location, p_difficulty,
     case when p_dive_mode = 'Boat Dive' then btrim(p_boat_name) else null end,
     case when p_dive_mode = 'Boat Dive' then nullif(btrim(coalesce(p_captain_name, '')), '') else null end,
     case when p_dive_mode = 'Boat Dive' then nullif(btrim(coalesce(p_boat_contact, '')), '') else null end,
     case when p_dive_mode = 'Boat Dive' then v_effective_crew_count else null end,
     v_effective_instructor,
     p_max_divers, true, nullif(btrim(coalesce(p_duty_notes, '')), ''),
     p_dive_date, 'active',
     coalesce(p_crew_members, '{}'),
     coalesce(p_dive_masters, '{}'))
  returning id into v_manifest_id;

  for v_diver in select * from jsonb_array_elements(p_divers) loop
    -- Resolve eco_id: prefer explicitly sent eco_id; if missing and tourist_id exists, look up eco_dive_ids
    v_resolved_eco_id := nullif(v_diver ->> 'eco_id', '');
    if v_resolved_eco_id is null and nullif(v_diver ->> 'tourist_id', '') is not null then
      select e.eco_id_number into v_resolved_eco_id
      from public.eco_dive_ids e
      where e.tourist_id = nullif(v_diver ->> 'tourist_id', '')::uuid
      limit 1;
    end if;

    insert into public.manifest_divers
      (manifest_id, name, eco_id, tourist_id, is_walk_in)
    values
      (v_manifest_id,
       btrim(v_diver ->> 'name'),
       v_resolved_eco_id,
       nullif(v_diver ->> 'tourist_id', '')::uuid,
       coalesce((v_diver ->> 'is_walk_in')::boolean, false));
  end loop;

  v_valid_until := (p_dive_date + interval '1 year')::date;
  foreach v_assign in array coalesce(p_annual_assign, '{}') loop
    insert into public.annual_pass_holders
      (operator_id, tourist_id, valid_from, valid_until, manifest_id)
    values
      (v_operator, v_assign, p_dive_date, v_valid_until, v_manifest_id);
  end loop;

  select coalesce(l.remaining_passes, 0)
  into v_remaining
  from public.operator_pass_ledger l
  where l.operator_id = v_operator;

  return jsonb_build_object('manifest_id', v_manifest_id, 'remaining', v_remaining);
end;
$$;

grant execute on function public.create_manifest_with_divers(
  text, text, text, text, text, text, text, integer, text, integer, date, jsonb, uuid[], text, text[], text[]
) to authenticated;
