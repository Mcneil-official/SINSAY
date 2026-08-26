-- 022_buy_pass_tables.sql
-- 1. Add 'rejected' status to payment_transactions
alter table public.payment_transactions
  drop constraint if exists payment_transactions_status_check;
alter table public.payment_transactions
  add constraint payment_transactions_status_check
  check (status in ('pending', 'verified', 'rejected'));

-- 2. Pass pricing table (TO-staff managed pricing tiers, operators read only)
create table if not exists public.pass_pricing (
  id uuid default gen_random_uuid() primary key,
  label text not null,
  passes integer not null,
  price numeric not null,
  description text,
  sort_order integer default 0,
  created_at timestamptz default now()
);
alter table public.pass_pricing enable row level security;
create policy "Anyone can read pass pricing"
  on public.pass_pricing for select
  using (true);

-- 3. Payment config table (TO-staff managed GCash details, operators read only)
create table if not exists public.payment_config (
  id uuid default gen_random_uuid() primary key,
  account_name text not null,
  account_number text not null,
  qr_code_url text,
  updated_at timestamptz default now()
);
-- Enforce single-row via partial unique index
create unique index if not exists idx_payment_config_single
  on public.payment_config ((true));
alter table public.payment_config enable row level security;
create policy "Anyone can read payment config"
  on public.payment_config for select
  using (true);

-- Seed default pass pricing tiers
insert into public.pass_pricing (label, passes, price, description, sort_order) values
  ('10 Dive Pass', 10, 8500, 'Good for 1 year', 1),
  ('25 Dive Pass', 25, 19500, 'Good for 1 year', 2),
  ('50 Dive Pass', 50, 35000, 'Good for 1 year', 3)
on conflict do nothing;
