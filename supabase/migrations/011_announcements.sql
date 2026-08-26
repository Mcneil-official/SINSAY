create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  body text,
  image_url text,
  active boolean default true,
  priority int default 0,
  start_date timestamptz,
  end_date timestamptz,
  created_at timestamptz default now()
);

alter table public.announcements enable row level security;

create policy "Anyone can read active announcements"
  on public.announcements for select
  using (active = true and (start_date is null or start_date <= now()) and (end_date is null or end_date >= now()));

create policy "TO staff insert announcements"
  on public.announcements for insert
  with check (auth.role() = 'authenticated');

create policy "TO staff update announcements"
  on public.announcements for update
  using (auth.role() = 'authenticated');

create policy "TO staff delete announcements"
  on public.announcements for delete
  using (auth.role() = 'authenticated');
