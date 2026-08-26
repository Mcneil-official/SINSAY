create table if not exists public.tourist_favorites (
  id uuid default gen_random_uuid() primary key,
  tourist_id uuid not null references public.tourists(id) on delete cascade,
  dive_site_id uuid not null references public.dive_sites(id) on delete cascade,
  created_at timestamptz default now(),
  unique (tourist_id, dive_site_id)
);

alter table public.tourist_favorites enable row level security;

create policy "Tourists read own favorites"
  on public.tourist_favorites for select
  using (auth.uid() = tourist_id);

create policy "Tourists insert own favorites"
  on public.tourist_favorites for insert
  with check (auth.uid() = tourist_id);

create policy "Tourists delete own favorites"
  on public.tourist_favorites for delete
  using (auth.uid() = tourist_id);
