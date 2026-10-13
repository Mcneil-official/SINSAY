-- 037_staff_read_extras.sql
-- Additive-only staff reads for announcements + notifications.
-- Existing policies are deliberately untouched (the Sinsay app may depend
-- on their current shape): staff JWTs pass them either way.
-- Closes two gaps: dashboard drafts/scheduled announcements were invisible
-- (public reads are active-only), and tourist notification traffic was
-- unobservable to staff.
-- Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres).

drop policy if exists "TO staff read all announcements" on public.announcements;
create policy "TO staff read all announcements"
  on public.announcements for select using (public.is_to_staff());
drop policy if exists "TO staff read all notifications" on public.notifications;
create policy "TO staff read all notifications"
  on public.notifications for select using (public.is_to_staff());

grant select on public.announcements to authenticated;
grant select on public.notifications to authenticated;

-- Realtime push for the announcements feed (optional; "already a member"
-- means push is already on — skip in that case).
alter publication supabase_realtime add table public.announcements;

-- Verification probes (run after applying):
--   select policyname, cmd from pg_policies
--    where schemaname = 'public'
--      and tablename in ('announcements', 'notifications')
--    order by tablename, policyname;
