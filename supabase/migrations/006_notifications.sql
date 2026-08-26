-- 006_notifications.sql
-- Notifications table for real-time user alerts

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  tourist_id uuid not null references public.tourists(id) on delete cascade,
  type text not null check (type in (
    'eco_dive_activated',
    'dive_plan_ready',
    'operator_application_approved',
    'operator_application_rejected',
    'pass_purchase_verified'
  )),
  title text not null,
  body text not null,
  deep_link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Users read own notifications"
  on public.notifications for select
  using (auth.uid() = tourist_id);

create policy "System inserts notifications"
  on public.notifications for insert
  with check (true);

create policy "Users update own notifications (mark read)"
  on public.notifications for update
  using (auth.uid() = tourist_id)
  with check (auth.uid() = tourist_id and is_read = true);

create index idx_notifications_tourist_unread
  on public.notifications(tourist_id, is_read)
  where is_read = false;

-- Enable realtime for notifications
alter publication supabase_realtime add table public.notifications;
