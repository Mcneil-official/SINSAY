create table if not exists public.establishments (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text,
  accreditation text default 'Accredited',
  phone text,
  email text,
  website text,
  facebook text,
  description text,
  image_url text,
  accredited boolean default true,
  created_at timestamptz default now()
);

alter table public.establishments enable row level security;

create policy "Anyone can read accredited establishments"
  on public.establishments for select
  using (accredited = true);

create policy "TO staff insert establishments"
  on public.establishments for insert
  with check (auth.role() = 'authenticated');

create policy "TO staff update establishments"
  on public.establishments for update
  using (auth.role() = 'authenticated');

create policy "TO staff delete establishments"
  on public.establishments for delete
  using (auth.role() = 'authenticated');

-- Seed data matching existing MOCK_ESTABLISHMENTS
insert into public.establishments (name, location, accreditation, phone, email, website, facebook, description) values
  ('Anilao Divers Resort', 'Barangay Anilao, Mabini, Batangas', 'Accredited', '+63 917 123 4567', 'info@anilaodivers.com', 'https://anilaodivers.com', 'AnilaoDiversResort', 'A premier dive resort offering comfortable accommodations and guided dive tours to the best sites in Anilao.'),
  ('Crystal Blue Resort', 'Barangay San Teodoro, Mabini, Batangas', 'Accredited', '+63 918 234 5678', 'reservations@crystalblueresort.com', 'https://crystalblueresort.com', 'CrystalBlueResort', 'Luxury beachfront resort with world-class diving facilities and a private beach.');
