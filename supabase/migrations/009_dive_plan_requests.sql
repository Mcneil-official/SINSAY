-- ============================================
-- SINSAY Migration P6 — Dive Plan Requests
-- ============================================

create table if not exists public.dive_plan_requests (
  id uuid default gen_random_uuid() primary key,
  tourist_id uuid not null references public.tourists(id) on delete cascade,
  destination text not null,
  start_date text not null,
  end_date text not null,
  divers integer not null,
  dive_type text not null,
  budget text,
  length_of_stay text,
  created_at timestamptz default now()
);

alter table public.dive_plan_requests enable row level security;

create policy "Insert own dive plans"
  on public.dive_plan_requests for insert
  with check (auth.uid() = tourist_id);

create policy "Read own dive plans"
  on public.dive_plan_requests for select
  using (auth.uid() = tourist_id);
