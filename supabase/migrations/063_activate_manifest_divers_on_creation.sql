-- 063_activate_manifest_divers_on_creation.sql
-- Immediately activate diver Eco-Dive IDs upon manifest creation and propagate pass type.
--
-- Background:
-- Migration 044 gated activation on Tourism Office staff verification (dive_manifests.verified),
-- which prevented Eco-Dive IDs from activating when dive operators submit manifests in the field.
-- This migration restores immediate activation upon manifest submission (status = 'active'),
-- updates tourists.dive_pass_type ('one-day' or 'annual'), inserts diver notifications,
-- updates create_manifest_with_divers RPC, and backfills current active manifests.

-- ── 1. Update activate_manifest_divers helper ──
create or replace function public.activate_manifest_divers(p_manifest_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  v_is_annual boolean;
  v_updated int;
begin
  for rec in
    select distinct md.tourist_id, md.manifest_id
    from public.manifest_divers md
    where md.manifest_id = p_manifest_id
      and md.tourist_id is not null
      and not coalesce(md.is_walk_in, false)
  loop
    -- Determine whether diver is covered by an annual pass
    select exists (
      select 1 from public.annual_pass_holders aph
      where aph.tourist_id = rec.tourist_id
        and current_date between aph.valid_from and aph.valid_until
    ) into v_is_annual;

    -- Upsert/Activate Eco-Dive ID
    insert into public.eco_dive_ids (tourist_id, eco_id_number, status, activated_at, activated_by_manifest_id)
    values (
      rec.tourist_id,
      'MBN-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8)),
      'active',
      now(),
      rec.manifest_id
    )
    on conflict (tourist_id) do update
    set status = 'active',
        updated_at = now(),
        activated_at = coalesce(public.eco_dive_ids.activated_at, now()),
        activated_by_manifest_id = rec.manifest_id;

    get diagnostics v_updated = row_count;

    -- Update tourists.dive_pass_type
    update public.tourists
    set dive_pass_type = case when v_is_annual then 'annual' else 'one-day' end,
        updated_at = now()
    where id = rec.tourist_id;

    -- Insert in-app notification if not already notified for this manifest
    if not exists (
      select 1 from public.notifications
      where tourist_id = rec.tourist_id
        and type = 'eco_dive_activated'
        and created_at > now() - interval '1 hour'
    ) then
      insert into public.notifications (tourist_id, type, title, body, deep_link)
      values (
        rec.tourist_id,
        'eco_dive_activated',
        'Eco-Dive ID Activated',
        'Your Eco-Dive ID has been activated! You are part of an active Dive Manifesto in Mabini.',
        '/(tabs)/eco-dive-id'
      );
    end if;
  end loop;
end;
$$;

revoke all on function public.activate_manifest_divers(uuid) from public;
grant execute on function public.activate_manifest_divers(uuid) to authenticated, service_role;

-- ── 2. Update on_manifest_diver_insert trigger function ──
create or replace function public.on_manifest_diver_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  for rec in
    select distinct md.manifest_id
    from new_table md
    join public.dive_manifests dm on dm.id = md.manifest_id
    where dm.status = 'active' or dm.verified
  loop
    perform public.activate_manifest_divers(rec.manifest_id);
  end loop;

  return null;
end;
$$;

drop trigger if exists after_manifest_divers_insert_activate on public.manifest_divers;
create trigger after_manifest_divers_insert_activate
  after insert on public.manifest_divers
  referencing new table as new_table
  for each statement
  execute function public.on_manifest_diver_insert();

-- ── 3. Update create_manifest_with_divers RPC ──
drop function if exists public.create_manifest_with_divers(
  text, text, text, text, text, text, text, integer, text, integer, date, jsonb, uuid[], text, text[], text[]
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

  -- Activate all registered divers for this manifest immediately
  perform public.activate_manifest_divers(v_manifest_id);

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

-- ── 4. Update expire_eco_dive_ids maintenance sweep ──
create or replace function public.expire_eco_dive_ids()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expired integer := 0;
begin
  with uncovered as (
    select e.id
    from public.eco_dive_ids e
    where e.status = 'active'
      and not exists (
        select 1
        from public.manifest_divers md
        join public.dive_manifests dm on dm.id = md.manifest_id
        where md.tourist_id = e.tourist_id
          and not coalesce(md.is_walk_in, false)
          and (dm.status = 'active' or dm.verified)
          and dm.dive_date >= current_date
      )
      and not exists (
        select 1
        from public.annual_pass_holders h
        left join public.dive_manifests dm on dm.id = h.manifest_id
        where h.tourist_id = e.tourist_id
          and h.valid_until >= current_date
          and (h.manifest_id is null or dm.status = 'active' or dm.verified)
      )
  )
  update public.eco_dive_ids e
  set status = 'expired',
      updated_at = now()
  from uncovered u
  where e.id = u.id;

  get diagnostics v_expired = row_count;
  return v_expired;
end;
$$;

revoke all on function public.expire_eco_dive_ids() from public;
grant execute on function public.expire_eco_dive_ids() to service_role;

-- ── 5. Ensure Realtime Publication for tourists and eco_dive_ids ──
do $$
begin
  alter publication supabase_realtime add table public.tourists;
exception when others then null;
end;
$$;

do $$
begin
  alter publication supabase_realtime add table public.eco_dive_ids;
exception when others then null;
end;
$$;

-- ── 6. Backfill existing active manifests ──
do $$
declare
  m_rec record;
begin
  for m_rec in
    select id from public.dive_manifests
    where dive_date >= current_date and status = 'active'
  loop
    perform public.activate_manifest_divers(m_rec.id);
  end loop;
end;
$$;
