-- 067_sync_eco_dive_id_status.sql
-- Resolves Eco-Dive ID staying "active" after manifest dive date has passed.
-- Provides a self-healing RPC callable by authenticated users to verify and expire their own ID,
-- and runs an immediate sweep for any stale active rows in the database.

-- 1. Self-healing function callable by authenticated tourists
create or replace function public.sync_my_eco_dive_id_status()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tourist_id uuid := auth.uid();
  v_eco_id_status text;
  v_has_active_manifest boolean := false;
  v_has_active_annual boolean := false;
  v_now_expired boolean := false;
begin
  if v_tourist_id is null then
    return jsonb_build_object('success', false, 'error', 'Not authenticated');
  end if;

  -- Get current status of tourist's Eco-Dive ID
  select status into v_eco_id_status
  from public.eco_dive_ids
  where tourist_id = v_tourist_id;

  if v_eco_id_status is null then
    return jsonb_build_object('success', true, 'status', null, 'expired', false);
  end if;

  -- If it's already expired or incomplete, nothing to expire
  if v_eco_id_status != 'active' then
    return jsonb_build_object('success', true, 'status', v_eco_id_status, 'expired', (v_eco_id_status = 'expired'));
  end if;

  -- Check if diver is on any manifest whose dive_date is today or in the future
  select exists (
    select 1
    from public.manifest_divers md
    join public.dive_manifests dm on dm.id = md.manifest_id
    where md.tourist_id = v_tourist_id
      and not coalesce(md.is_walk_in, false)
      and (dm.status = 'active' or dm.verified)
      and dm.dive_date >= current_date
  ) into v_has_active_manifest;

  -- Check if diver is covered by an active annual pass
  select exists (
    select 1
    from public.annual_pass_holders h
    left join public.dive_manifests dm on dm.id = h.manifest_id
    where h.tourist_id = v_tourist_id
      and h.valid_until >= current_date
      and (h.manifest_id is null or dm.status = 'active' or dm.verified)
  ) into v_has_active_annual;

  -- If neither active manifest nor annual pass exists, expire the Eco-Dive ID
  if not v_has_active_manifest and not v_has_active_annual then
    update public.eco_dive_ids
    set status = 'expired',
        updated_at = now()
    where tourist_id = v_tourist_id;

    update public.tourists
    set status = 'Expired',
        updated_at = now()
    where id = v_tourist_id;

    v_now_expired := true;
    v_eco_id_status := 'expired';
  end if;

  return jsonb_build_object(
    'success', true,
    'status', v_eco_id_status,
    'expired', v_now_expired,
    'has_active_manifest', v_has_active_manifest,
    'has_active_annual', v_has_active_annual
  );
end;
$$;

revoke all on function public.sync_my_eco_dive_id_status() from public;
grant execute on function public.sync_my_eco_dive_id_status() to authenticated;

-- 2. Immediate backfill sweep: expire all stale 'active' Eco-Dive IDs in DB
with uncovered as (
  select e.id, e.tourist_id
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
