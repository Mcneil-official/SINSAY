-- ============================================
-- SINSAY Migration B2 — Eco-Dive IDs
-- ============================================

-- 1. ECO DIVE IDS TABLE
create table if not exists public.eco_dive_ids (
  id uuid default gen_random_uuid() primary key,
  tourist_id uuid not null references public.tourists(id) on delete cascade unique,
  eco_id_number text not null,
  status text not null default 'incomplete' check (status in ('incomplete', 'complete')),
  created_at timestamptz default now()
);

-- 2. RLS
alter table public.eco_dive_ids enable row level security;

create policy "Users can view own eco-dive ID"
  on public.eco_dive_ids for select
  using (auth.uid() = tourist_id);

create policy "Users can insert own eco-dive ID"
  on public.eco_dive_ids for insert
  with check (auth.uid() = tourist_id);

create policy "Users can update own eco-dive ID"
  on public.eco_dive_ids for update
  using (auth.uid() = tourist_id);
