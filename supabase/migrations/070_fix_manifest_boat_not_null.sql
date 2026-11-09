-- 070_fix_manifest_boat_not_null.sql
-- Fix: Make boat_name nullable on dive_manifests and make create_manifest_with_divers resilient for non-boat dive modes

-- 1. Ensure boat_name is nullable for non-boat dive modes (Shore Entry, Night Dive)
alter table public.dive_manifests
  alter column boat_name drop not null;

alter table public.dive_manifests
  alter column boat_name set default null;

-- 2. Ensure locations array column exists
alter table public.dive_manifests
  add column if not exists locations text[] default '{}'::text[];

-- 3. Replace create_manifest_with_divers RPC to handle non-boat dives and multiple locations
drop function if exists public.create_manifest_with_divers(
  text, text, text, text, text, text, text, integer, text, integer, date, jsonb, uuid[], text, text[], text[]
);
drop function if exists public.create_manifest_with_divers(
  text, text, text, text, text, text, text, integer, text, integer, date, jsonb, uuid[], text, text[], text[], text[]
);

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
  p_dive_masters text[] default '{}'::text[],
  p_locations text[] default '{}'::text[]
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
  v_assign uuid;
  v_remaining integer;
  v_annual_remaining integer;
  v_needed integer := 0;
  v_valid_until date;
  v_diver_count integer;
  v_new_assign integer;
  v_effective_crew_count integer;
  v_effective_instructor text;
  v_resolved_eco_id text;
  v_effective_location text;
  v_final_locations text[];
  v_effective_boat_name text;
begin
  v_operator := auth.uid();
  if v_operator is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from public.operator_applications
    where tourist_id = v_operator and status = 'approved'
  ) then
    raise exception 'Only approved operators can create dive manifests';
  end if;

  if p_dive_date is null or p_dive_date < current_date then
    raise exception 'Dive date cannot be in the past';
  end if;

  if p_dive_mode = 'Boat Dive' then
    if nullif(btrim(coalesce(p_boat_name, '')), '') is null then
      raise exception 'Boat name is required for boat dives';
    end if;
    if nullif(btrim(coalesce(p_captain_name, '')), '') is null then
      raise exception 'Captain name is required for boat dives';
    end if;
    if nullif(btrim(coalesce(p_boat_contact, '')), '') is null then
      raise exception 'Boat contact is required for boat dives';
    end if;
    v_effective_boat_name := btrim(p_boat_name);
  else
    -- Non-boat dive mode: use provided boat name if any, otherwise fall back to dive mode name
    v_effective_boat_name := coalesce(nullif(btrim(coalesce(p_boat_name, '')), ''), p_dive_mode, 'Shore Entry');
  end if;

  -- Resolve effective crew count
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

  -- Resolve effective location text and array
  if p_locations is not null and array_length(p_locations, 1) > 0 then
    v_final_locations := p_locations;
    v_effective_location := array_to_string(p_locations, ', ');
  elsif p_location is not null and btrim(p_location) <> '' then
    v_final_locations := array[btrim(p_location)];
    v_effective_location := btrim(p_location);
  else
    raise exception 'Dive location is required';
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
    ) then
      raise exception 'Annual pass assignee % is not in the diver list', v_assign;
    end if;
  end loop;

  v_new_assign := coalesce(array_length(p_annual_assign, 1), 0);
  select coalesce(l.annual_remaining, 0)
  into v_annual_remaining
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
  select coalesce(l.remaining_passes, 0)
  into v_remaining
  from public.operator_pass_ledger l
  where l.operator_id = v_operator;
  if v_remaining < v_needed then
    raise exception 'Not enough dive passes: need %, have %', v_needed, v_remaining;
  end if;

  insert into public.dive_manifests
    (operator_id, dive_type, dive_mode, location, difficulty, boat_name,
     captain_name, boat_contact, crew_count, instructor_name,
     max_divers, duty_of_care, duty_of_care_notes, dive_date, status,
     crew_members, dive_masters, locations)
  values
    (v_operator, p_dive_type, p_dive_mode, v_effective_location, p_difficulty,
     v_effective_boat_name,
     case when p_dive_mode = 'Boat Dive' then nullif(btrim(coalesce(p_captain_name, '')), '') else null end,
     case when p_dive_mode = 'Boat Dive' then nullif(btrim(coalesce(p_boat_contact, '')), '') else null end,
     case when p_dive_mode = 'Boat Dive' then v_effective_crew_count else null end,
     v_effective_instructor,
     p_max_divers, true, nullif(btrim(coalesce(p_duty_notes, '')), ''),
     p_dive_date, 'active',
     coalesce(p_crew_members, '{}'),
     coalesce(p_dive_masters, '{}'),
     v_final_locations)
  returning id into v_manifest_id;

  for v_diver in select * from jsonb_array_elements(p_divers) loop
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

  perform public.activate_manifest_divers(v_manifest_id);

  select coalesce(l.remaining_passes, 0)
  into v_remaining
  from public.operator_pass_ledger l
  where l.operator_id = v_operator;

  return jsonb_build_object('manifest_id', v_manifest_id, 'remaining', v_remaining);
end;
$$;

grant execute on function public.create_manifest_with_divers(
  text, text, text, text, text, text, text, integer, text, integer, date, jsonb, uuid[], text, text[], text[], text[]
) to authenticated;
