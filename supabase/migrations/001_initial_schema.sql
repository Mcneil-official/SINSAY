-- ============================================
-- SINSAY Database Schema — Phase 2 (B1)
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. TOURISTS TABLE
create table if not exists public.tourists (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  contact_number text,
  nationality text,
  emergency_contact_name text,
  emergency_contact_number text,
  dive_pass_type text,
  type_of_dive text,
  certification_level text,
  date_accredited date,
  renewal_date date,
  business_permit_url text,
  pcss_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. OPERATOR APPLICATIONS TABLE
create table if not exists public.operator_applications (
  id uuid default gen_random_uuid() primary key,
  tourist_id uuid not null references public.tourists(id) on delete cascade,
  resort_name text not null,
  resort_location text not null,
  role text not null,
  contact_number text not null,
  facebook_url text,
  website_url text,
  business_permit_url text,
  pcss_url text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. DIVE PASS INVENTORY TABLE
create table if not exists public.dive_pass_inventory (
  id uuid default gen_random_uuid() primary key,
  operator_id uuid not null references public.tourists(id) on delete cascade,
  pass_type text not null check (pass_type in ('single', 'multi')),
  pass_label text not null,
  total_passes integer not null check (total_passes > 0),
  remaining_passes integer not null check (remaining_passes >= 0),
  amount numeric not null check (amount > 0),
  created_at timestamptz default now()
);

-- 4. PAYMENT TRANSACTIONS TABLE
create table if not exists public.payment_transactions (
  id uuid default gen_random_uuid() primary key,
  operator_id uuid not null references public.tourists(id) on delete cascade,
  dive_pass_inventory_id uuid references public.dive_pass_inventory(id),
  amount numeric not null check (amount > 0),
  reference_number text not null,
  receipt_url text,
  status text not null default 'pending' check (status in ('pending', 'verified')),
  created_at timestamptz default now()
);

-- 5. DIVE MANIFESTS TABLE
create table if not exists public.dive_manifests (
  id uuid default gen_random_uuid() primary key,
  operator_id uuid not null references public.tourists(id) on delete cascade,
  dive_type text not null,
  dive_mode text not null,
  location text not null,
  difficulty text not null,
  boat_name text not null,
  max_divers integer not null default 16,
  duty_of_care boolean not null default false,
  status text not null default 'active' check (status in ('active', 'done')),
  created_at timestamptz default now()
);

-- 6. MANIFEST DIVERS TABLE
create table if not exists public.manifest_divers (
  id uuid default gen_random_uuid() primary key,
  manifest_id uuid not null references public.dive_manifests(id) on delete cascade,
  name text not null,
  eco_id text,
  is_walk_in boolean not null default false,
  created_at timestamptz default now()
);

-- 7. AUTO-CREATE TOURIST PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tourists (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 8. AUTO-UPDATE UPDATED_AT
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_tourists
  before update on public.tourists
  for each row execute function public.handle_updated_at();

create trigger set_updated_at_operator_applications
  before update on public.operator_applications
  for each row execute function public.handle_updated_at();

-- 9. STORAGE BUCKETS
insert into storage.buckets (id, name, public)
values
  ('tourist_uploads', 'tourist_uploads', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values
  ('operator_uploads', 'operator_uploads', true)
on conflict (id) do nothing;

-- 10. RLS POLICIES
alter table public.tourists enable row level security;
alter table public.operator_applications enable row level security;
alter table public.dive_pass_inventory enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.dive_manifests enable row level security;
alter table public.manifest_divers enable row level security;

-- Tourists: read/update own profile only
create policy "Users can view own profile"
  on public.tourists for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.tourists for update
  using (auth.uid() = id);

-- Operator applications: users manage their own
create policy "Users can view own applications"
  on public.operator_applications for select
  using (auth.uid() = tourist_id);

create policy "Users can insert own applications"
  on public.operator_applications for insert
  with check (auth.uid() = tourist_id);

-- Dive pass inventory: operators manage their own
create policy "Operators can view own inventory"
  on public.dive_pass_inventory for select
  using (auth.uid() = operator_id);

create policy "Operators can insert inventory"
  on public.dive_pass_inventory for insert
  with check (auth.uid() = operator_id);

-- Payment transactions: operators manage their own
create policy "Operators can view own payments"
  on public.payment_transactions for select
  using (auth.uid() = operator_id);

create policy "Operators can insert payments"
  on public.payment_transactions for insert
  with check (auth.uid() = operator_id);

-- Dive manifests: operators manage their own
create policy "Operators can view own manifests"
  on public.dive_manifests for select
  using (auth.uid() = operator_id);

create policy "Operators can insert manifests"
  on public.dive_manifests for insert
  with check (auth.uid() = operator_id);

-- Manifest divers: operators manage their manifest's divers
create policy "Operators can view manifest divers"
  on public.manifest_divers for select
  using (
    exists (
      select 1 from public.dive_manifests dm
      where dm.id = manifest_id and dm.operator_id = auth.uid()
    )
  );

create policy "Operators can insert manifest divers"
  on public.manifest_divers for insert
  with check (
    exists (
      select 1 from public.dive_manifests dm
      where dm.id = manifest_id and dm.operator_id = auth.uid()
    )
  );
