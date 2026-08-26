create table if not exists public.dive_sites (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  difficulty text,
  rating text,
  image_url text,
  created_at timestamptz default now()
);

alter table public.dive_sites enable row level security;

create policy "Anyone can read dive sites"
  on public.dive_sites for select
  using (true);

create policy "TO staff insert dive sites"
  on public.dive_sites for insert
  with check (auth.role() = 'authenticated');

create policy "TO staff update dive sites"
  on public.dive_sites for update
  using (auth.role() = 'authenticated');

create policy "TO staff delete dive sites"
  on public.dive_sites for delete
  using (auth.role() = 'authenticated');

-- Seed data matching existing MOCK_SITES
insert into public.dive_sites (name, description, difficulty, rating) values
  ('Anilao Cove', 'A beautiful cove in Mabini, Batangas known for its rich marine biodiversity and excellent snorkeling spots.', 'Beginner', '4.5'),
  ('Sombrero Island', 'A hat-shaped island offering stunning coral gardens and diverse marine life.', 'Intermediate', '4.3'),
  ('Sepoc Beach', 'A calm beachfront dive site perfect for beginner divers and snorkelers.', 'Beginner', '4.7'),
  ('Mainit', 'A deep dive site with strong currents suitable for advanced divers.', 'Advanced', '4.2'),
  ('Tingloy', 'A marine sanctuary with vibrant coral reefs and abundant fish species.', 'Intermediate', '4.0'),
  ('Arthur''s Rock', 'A famous macro photography site known for rare critters and unique marine species.', 'Advanced', '4.6');
