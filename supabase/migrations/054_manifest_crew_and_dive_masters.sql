-- 054_manifest_crew_and_dive_masters.sql
-- Adds crew_members and dive_masters array columns to dive_manifests
-- and updates create_manifest_with_divers RPC to store them.

-- 1. Add crew_members and dive_masters columns to dive_manifests
alter table public.dive_manifests
  add column if not exists crew_members text[] default '{}',
  add column if not exists dive_masters text[] default '{}';

-- 2. Update create_manifest_with_divers function to accept crew_members and dive_masters
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
  p_annual_assign uuid[] default '{}',
  p_duty_notes text default null,
  p_crew_members text[] default '{}',
  p_dive_masters text[] default '{}'
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
  v_effective_crew_count integer;
  v_effective_instructor text;
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

  -- Determine effective crew count
  v_effective_crew_count := coalesce(
    nullif(array_length(p_crew_members, 1), 0),
    p_crew_count,
    0
  );

  -- Determine primary instructor name if single string is empty
  v_effective_instructor := coalesce(
    nullif(btrim(coalesce(p_instructor_name, '')), ''),
    case when array_length(p_dive_masters, 1) > 0 then p_dive_masters[1] else null end
  );

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
    if v_effective_crew_count < 0 then
      raise exception 'A valid crew count is required for boat dives';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtext('manifest:' || v_operator::text));

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

  select coalesce(l.remaining_passes, 0), coalesce(l.annual_remaining, 0)
  into v_remaining, v_annual_remaining
  from public.operator_pass_ledger l
  where l.operator_id = v_operator;
  if v_annual_remaining < v_new_assign then
    raise exception 'Not enough annual slots: need %, have %', v_new_assign, v_annual_remaining;
  end if;

  -- Calculate dive passes needed strictly for paying tourist divers (crew & dive masters are exempt)
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
    insert into public.manifest_divers
      (manifest_id, name, eco_id, tourist_id, is_walk_in)
    values
      (v_manifest_id,
       btrim(v_diver ->> 'name'),
       nullif(v_diver ->> 'eco_id', ''),
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
