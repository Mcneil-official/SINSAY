-- 044_eco_id_lifecycle.sql
-- Eco-Dive ID lifecycle: activate on TO verification, expire via daily sweep.
--
-- Activation previously fired on manifest_divers INSERT (007/039), i.e. at
-- operator submission. This migration gates activation on the manifest being
-- TO-verified (dive_manifests.verified), per decision. It also adds the
-- missing Expired transition: a pg_cron sweep flips active IDs to expired once
-- they are no longer covered by a verified one-day manifesto (dive_date >=
-- today) or an annual pass (valid_until >= today). Expiry is silent (status
-- flip only, no notification).
--
-- Idempotent / re-runnable. Requires: 007/039 (activation), 015 (audit cols),
-- 021 (manifest_divers.tourist_id), 027/041 (annual_pass_holders + manifest_id),
-- 032 (dive_manifests.verified), 002/008 (eco_dive_ids).
-- Apply in Supabase SQL Editor (service role / postgres), AFTER 043.

-- ── 1. Shared activation helper (per manifest) ──
-- Not client-callable: SECURITY DEFINER + explicit REVOKE below. Only the
-- triggers below invoke it.
create or replace function public.activate_manifest_divers(p_manifest_id uuid)
returns void
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
    where md.manifest_id = p_manifest_id
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
end;
$$;

revoke all on function public.activate_manifest_divers(uuid) from public;
revoke all on function public.activate_manifest_divers(uuid) from anon, authenticated;

-- ── 2. Activate when a manifest is TO-verified (false -> true) ──
-- `after update of verified` fires whenever `verified` is in the SET list; the
-- guard below enforces an actual false->true transition.
create or replace function public.on_manifest_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.verified and not coalesce(old.verified, false) then
    perform public.activate_manifest_divers(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists after_manifest_verified_activate on public.dive_manifests;
create trigger after_manifest_verified_activate
  after update of verified on public.dive_manifests
  for each row
  execute function public.on_manifest_verified();

-- ── 3. Activate a diver added to an ALREADY-verified manifest ──
-- Covers a future add-diver-to-verified-manifest path; today's submit RPC
-- inserts all divers while the manifest is still unverified, so this is a
-- safety net rather than the primary path.
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
    join public.dive_manifests dm on dm.id = md.manifest_id and dm.verified
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

-- Old submission-time activation function is now unused.
drop function if exists public.activate_eco_dive_ids();

-- ── 4. Expiration sweep ──
-- Coverage:
--   one-day: on a verified manifest with dive_date >= today
--   annual : annual_pass_holders row with valid_until >= today
--            (anchor manifest verified, or unlinked legacy row)
-- Forward-only (active -> expired); re-activation happens via section 2.
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
          and not md.is_walk_in
          and dm.verified
          and dm.dive_date >= current_date
      )
      and not exists (
        select 1
        from public.annual_pass_holders h
        left join public.dive_manifests dm on dm.id = h.manifest_id
        where h.tourist_id = e.tourist_id
          and h.valid_until >= current_date
          -- manifest_id is nullable (legacy rows predate 041): a NULL link
          -- still counts as coverage — never expire a valid annual holder.
          and (h.manifest_id is null or dm.verified)
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
revoke all on function public.expire_eco_dive_ids() from anon, authenticated;

-- ── 5. Schedule the sweep (02:00 PHT = 18:00 UTC) ──
-- Requires the pg_cron extension (enable once via dashboard or this statement).
create extension if not exists pg_cron;

do $$
begin
  perform cron.unschedule('sinsay_expire_eco_dive_ids');
exception when others then
  null;  -- job did not exist yet
end;
$$;

select cron.schedule(
  'sinsay_expire_eco_dive_ids',
  '0 18 * * *',
  $$select public.expire_eco_dive_ids();$$
);

-- ── Probes (run after applying) ──
-- 1. Trigger defs:
--    select tgname from pg_trigger where tgrelid = 'public.dive_manifests'::regclass;
--    select tgname from pg_trigger where tgrelid = 'public.manifest_divers'::regclass;
-- 2. Cron job:
--    select jobid, jobname, schedule, command from cron.job
--     where jobname = 'sinsay_expire_eco_dive_ids';
-- 3. Manual sweep (returns rows expired):
--    select public.expire_eco_dive_ids();
-- 4. Submit a manifest → diver IDs stay 'complete'; set verified=true →
--    they flip to 'active' + eco_dive_activated notification; backdate the
--    manifest's dive_date past today → sweep flips them to 'expired'.
