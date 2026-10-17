-- 043_notification_triggers.sql
-- Missing notification triggers: manifesto-submitted (operator) + announcement
-- fan-out (all tourists). In-app delivery only (no device push): rows land in
-- public.notifications, which is already realtime-published (006) and
-- consumed by AuthContext channels → bell badge + list. No client changes
-- needed beyond icon/color entries for the new types.
-- Idempotent / re-runnable. Requires 006 (table) + 011 (announcements).
-- Apply AFTER 042.

-- ── 1. Widen the type check (006's inline CHECK is named
-- notifications_type_check by convention) ──
alter table public.notifications
  drop constraint if exists notifications_type_check;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'eco_dive_activated',
    'dive_plan_ready',
    'operator_application_approved',
    'operator_application_rejected',
    'pass_purchase_verified',
    'manifest_submitted',
    'announcement_published'
  ));

-- ── 2. Manifesto submitted → operator confirmation row ──
-- The activation trigger (007/039) notifies only the divers; the submitting
-- operator previously got nothing durable (just the transient confirmed
-- screen). Statement-level to match the 007 pattern.
create or replace function public.notify_manifest_submitted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
  v_count integer;
begin
  for rec in
    select nt.id, nt.operator_id, nt.boat_name, nt.location, nt.dive_date
    from new_table nt
  loop
    select count(*) into v_count
    from public.manifest_divers md
    where md.manifest_id = rec.id;

    insert into public.notifications (tourist_id, type, title, body, deep_link)
    values (
      rec.operator_id,
      'manifest_submitted',
      'Manifesto submitted',
      format(
        '%s · %s divers · %s',
        coalesce(rec.boat_name, 'Dive group'),
        v_count,
        to_char(rec.dive_date, 'Mon DD, YYYY')
      ),
      '/(operator-tabs)/manifests'
    );
  end loop;

  return null;
end;
$$;

drop trigger if exists after_manifest_insert_notify on public.dive_manifests;
create trigger after_manifest_insert_notify
  after insert on public.dive_manifests
  referencing new table as new_table
  for each statement
  execute function public.notify_manifest_submitted();

-- ── 3. Announcement published → one row per tourist ──
-- Fires only for rows inserted active. Inactive inserts (scheduled drafts)
-- stay silent; a later UPDATE flipping active does NOT fan out (documented
-- limitation — TO publishes active rows directly). Cost note: one row per
-- tourist per announcement; fine at current scale, revisit with digest
-- batching if tourists grow 10–100x.
create or replace function public.notify_announcement_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.active, true) is distinct from true then
    return new;
  end if;

  insert into public.notifications (tourist_id, type, title, body, deep_link)
  select
    t.id,
    'announcement_published',
    new.title,
    coalesce(nullif(new.body, ''), new.title),
    '/(tabs)'
  from public.tourists t;

  return new;
end;
$$;

drop trigger if exists after_announcement_insert_notify on public.announcements;
create trigger after_announcement_insert_notify
  after insert on public.announcements
  for each row
  execute function public.notify_announcement_published();

-- ── Probes (run after applying) ──
-- insert a test manifest via the app → select * from notifications where type='manifest_submitted';
-- insert into announcements(title, body, active) values ('Probe','Probe body',true);
--   → row count jumps by tourist count; then delete both probe rows.
