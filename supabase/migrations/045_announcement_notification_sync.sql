-- 045_announcement_notification_sync.sql
-- Keep tourist notifications clean when announcements are deleted or deactivated.

-- 1. Ensure notify_announcement_published sets deep_link to /announcement/<id>
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
    '/announcement/' || new.id
  from public.tourists t;

  return new;
end;
$$;

-- 2. Trigger function to cleanup notifications when an announcement is deleted or marked inactive
create or replace function public.cleanup_deleted_announcement_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications
  where type = 'announcement_published'
    and (
      deep_link = '/announcement/' || old.id
      or title = old.title
    );
  return old;
end;
$$;

drop trigger if exists after_announcement_delete_notify on public.announcements;
create trigger after_announcement_delete_notify
  after delete on public.announcements
  for each row
  execute function public.cleanup_deleted_announcement_notifications();

create or replace function public.cleanup_inactive_announcement_notifications()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.active = true and coalesce(new.active, false) = false then
    delete from public.notifications
    where type = 'announcement_published'
      and (
        deep_link = '/announcement/' || old.id
        or title = old.title
      );
  end if;
  return new;
end;
$$;

drop trigger if exists after_announcement_update_active_notify on public.announcements;
create trigger after_announcement_update_active_notify
  after update of active on public.announcements
  for each row
  execute function public.cleanup_inactive_announcement_notifications();

-- 3. Allow tourists to delete their own notifications if needed
drop policy if exists "Users delete own notifications" on public.notifications;
create policy "Users delete own notifications"
  on public.notifications for delete
  using (auth.uid() = tourist_id);

-- 4. One-time cleanup for any existing orphan announcement notifications
delete from public.notifications n
where n.type = 'announcement_published'
  and not exists (
    select 1 from public.announcements a
    where a.active = true
      and (
        n.deep_link = '/announcement/' || a.id
        or n.title = a.title
      )
  );

-- 5. Backfill deep_link for existing active announcement notifications that were created with /(tabs)
update public.notifications n
set deep_link = '/announcement/' || a.id
from public.announcements a
where n.type = 'announcement_published'
  and (n.deep_link is null or n.deep_link = '/(tabs)')
  and lower(trim(n.title)) = lower(trim(a.title));

