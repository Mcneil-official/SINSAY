-- 071_prepopulate_dive_resorts_and_claim_flow.sql
-- Pre-populates 20 prominent Mabini dive resorts and establishes the claim workflow.

-- 1. Schema Updates
alter table public.establishments
  add column if not exists is_claimed boolean not null default false;

alter table public.operator_applications
  add column if not exists establishment_id uuid references public.establishments(id) on delete set null;

-- Mark any establishment already linked to an operator as claimed
update public.establishments
set is_claimed = true
where operator_id is not null;

-- Helpful index for unclaimed directory lookups and claim queries
create index if not exists idx_establishments_is_claimed
  on public.establishments(is_claimed)
  where is_claimed = false;

create index if not exists idx_operator_applications_establishment_id
  on public.operator_applications(establishment_id);

-- 2. Seed 20 Pre-Populated Dive Resorts in Mabini, Batangas
insert into public.establishments (
  name,
  location,
  accreditation,
  phone,
  email,
  website,
  facebook,
  description,
  accredited,
  is_claimed
)
values
  (
    'Camp Netanya Resort & Spa',
    'Bauan - Mabini Rd, Mabini, Batangas',
    null,
    '+63 927 895 4092',
    null,
    'http://campnetanya.com.ph/',
    'https://www.facebook.com/campnetanya',
    'Santorini-inspired luxury resort situated along the Anilao coastline in Mabini, offering house reef diving, infinity pools, and full resort amenities.',
    true,
    false
  ),
  (
    'Eagle Point Beach and Dive Resort',
    'Barangay Bagalangit, Mabini, Batangas',
    null,
    '+63 917 846 3958',
    null,
    'http://www.eaglepointresort.com.ph/',
    'https://www.facebook.com/eaglepointbeachanddiveresort',
    'Pioneer dive and leisure resort in Mabini, featuring its own dive center, saltwater pools, and quick boat access to nearby reef sites.',
    true,
    false
  ),
  (
    'Altamare Dive & Leisure Resort Anilao',
    'Brgy. San Teodoro, Mabini, Batangas',
    null,
    '+63 916 691 9222',
    null,
    'http://www.altamare.com.ph/',
    'https://www.facebook.com/altamareresort',
    'Offers scenic hillside ocean views, an infinity pool overlooking Balayan Bay, and guided diving sessions along the Mabini peninsula.',
    true,
    false
  ),
  (
    'Aquaventure Reef Club',
    'Sitio Looc, Brgy. Bagalangit, Mabini, Batangas',
    null,
    '+63 939 924 6488',
    null,
    'https://www.aqua-venture.com/',
    'https://www.facebook.com/aquaventurereefclub',
    'Historic pioneer dive center in Mabini, featuring on-site SSI/PADI dive courses, camera preparation areas, and direct beachfront access.',
    true,
    false
  ),
  (
    'Aiyanar Beach and Dive Resort',
    'Sitio Looc, Brgy. Bagalangit, Mabini, Batangas',
    null,
    '+63 917 883 1428',
    null,
    'http://www.aiyanar.com/',
    'https://www.facebook.com/AiyanarAnilao',
    'Premier dive establishment engineered specifically for underwater photography enthusiasts, featuring extensive dive facilities and oceanfront suites.',
    true,
    false
  ),
  (
    'Solitude Acacia Resort',
    'Brgy. Ligaya, Mabini, Batangas',
    null,
    '+63 966 200 2941',
    null,
    'https://solitude.world/',
    'https://www.facebook.com/SolitudeAcacia',
    'Serene eco-friendly getaway surrounded by giant acacia trees, featuring dive training pools, full scuba gear services, and fine dining.',
    true,
    false
  ),
  (
    'Planet Dive Resort',
    'Brgy. San Teodoro, Mabini, Batangas',
    null,
    '+63 916 704 3718',
    null,
    'http://planetdive.com.ph/',
    'https://www.facebook.com/planetdiveresort',
    'Sits directly in front of the famous Twin Rocks Marine Protected Area, offering immediate shore access to world-class macro marine life and freediving buoys.',
    true,
    false
  ),
  (
    'The Philip Ann Resort',
    'Brgy. Solo, Mabini Circumferential Rd, Mabini, Batangas',
    null,
    '+63 915 933 5633',
    null,
    'https://www.thephilipannresort.com/',
    'https://www.facebook.com/1pjhphilipannresort',
    'Modern relaxed setting equipped with a dive shop, pool, steam/sauna facilities, and beachfront lounge decks.',
    true,
    false
  ),
  (
    'Bentrina Diving Resort',
    'Mabini Circumferential Rd, Mabini, Batangas',
    null,
    '+63 976 363 2424',
    null,
    'https://www.bentrina.com/',
    'https://www.facebook.com/bentrinaresort',
    'Boutique resort featuring deep scuba training pools, house reef diving, and personal dive guide services.',
    true,
    false
  ),
  (
    'Amor Laut',
    'Mabini Circumferential Rd, Brgy. San Jose, Mabini, Batangas',
    null,
    '+63 917 108 7451',
    null,
    'https://www.amorlautresort.com/',
    'https://www.facebook.com/amorlautresort',
    'Hillside architecture with dual swimming pools and scuba dive center services catering to weekend divers and vacationers.',
    true,
    false
  ),
  (
    'Saltitude Dive & Beach Resort',
    'Mabini Circumferential Rd, Mabini, Batangas',
    null,
    '+63 917 109 8812',
    null,
    null,
    'https://www.facebook.com/profile.php?id=100063830172974',
    'Themed dive resort offering watersports rentals, guided scuba trips, and cozy seaside dining along the Mabini coast.',
    true,
    false
  ),
  (
    'Paradiso Rito',
    'Mabini Circumferential Rd, Mabini, Batangas',
    null,
    '+63 928 420 5438',
    null,
    'https://paradisorito.com/',
    'https://www.facebook.com/ParadisoRito',
    'Peaceful beachfront atmosphere facing Tingloy Island with on-site diving courses and a shared guest kitchen.',
    true,
    false
  ),
  (
    'Portulano Dive Resort',
    'Bauan - Mabini Coastline, Batangas',
    null,
    '+63 917 540 4257',
    null,
    'http://www.portulano.com/',
    'https://www.facebook.com/portulanodiveresort',
    'Quiet, safety-oriented dive resort known for personalized dive training and rich house-reef snorkeling.',
    true,
    false
  ),
  (
    'Vista Aplaya Resort',
    'Brgy. Balagbag, Bagalangit, Mabini, Batangas',
    null,
    '+63 917 669 1222',
    null,
    null,
    'https://www.facebook.com/vistaaplayaresort',
    'Oceanfront cottage accommodations, swimming pools, and boat rentals for island hopping and diving.',
    true,
    false
  ),
  (
    'Vivere Azure',
    'Brgy. Aguada, San Teodoro, Mabini, Batangas',
    null,
    '+63 2 8771 7777',
    null,
    'https://vivereazure.com/',
    'https://www.facebook.com/vivere.azure',
    'Luxury boutique resort featuring panoramic view suites, infinity pools, and direct access to rich snorkeling and diving reefs.',
    true,
    false
  ),
  (
    'Pier Uno Dive Resort',
    'Brgy. Solo, Mabini, Batangas',
    null,
    '+63 917 808 1877',
    null,
    'https://pierunodiveresort.com/',
    'https://www.facebook.com/pierunodiveresort.ph',
    'Convenient driveway access for unloading dive gear, along with on-site PADI dive instruction and buffet dining.',
    true,
    false
  ),
  (
    'Arthur''s Place Dive Resort',
    'Brgy. San Teodoro, Mabini, Batangas',
    null,
    '+63 917 777 9341',
    null,
    'https://www.arthursplacediveresort.com/',
    'https://www.facebook.com/arthursplacediveresort',
    'Adjacent to Arthur''s Rock Marine Protected Area, offering rustic sea-view rooms and experienced local dive guides.',
    true,
    false
  ),
  (
    'Sea Spring Resort',
    'Mainit, Mabini, Batangas',
    null,
    '+63 917 564 8085',
    null,
    null,
    'https://www.facebook.com/seasspring',
    'Large seaside resort featuring natural hot spring mineral pools, dive facilities, and oceanview rooms along the southern Mabini peninsula.',
    true,
    false
  ),
  (
    'Blue Ribbon Dive Resort',
    'National Road, Brgy. Ligaya, Mabini, Batangas',
    null,
    '+63 917 893 2719',
    null,
    'https://blueribbondivers.com/',
    'https://www.facebook.com/Blueribbonphilippines',
    'Dedicated dive resort offering PADI courses, a training pool, sunset views, and dive trips across Mabini''s top dive sites.',
    true,
    false
  )
on conflict do nothing;

-- 3. Trigger Function: Claim pre-populated listing or create new listing on approval
create or replace function public.sync_operator_application_public_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_avatar_path text;
  v_target_est_id uuid;
begin
  if new.status <> 'approved' then
    return new;
  end if;

  select t.email, t.avatar_path
  into v_email, v_avatar_path
  from public.tourists t
  where t.id = new.tourist_id;

  -- 1) Explicit establishment_id from application
  if new.establishment_id is not null then
    v_target_est_id := new.establishment_id;
  else
    -- 2) Match by name & location on an unclaimed listing (case-insensitive)
    select e.id into v_target_est_id
    from public.establishments e
    where lower(trim(e.name)) = lower(trim(new.resort_name))
      and lower(trim(coalesce(e.location, ''))) = lower(trim(coalesce(new.resort_location, '')))
      and (e.is_claimed = false or e.operator_id is null)
    limit 1;
  end if;

  if v_target_est_id is not null then
    -- Claim existing establishment
    update public.establishments
    set
      operator_id = new.tourist_id,
      is_claimed = true,
      name = coalesce(nullif(trim(new.resort_name), ''), name),
      location = coalesce(nullif(trim(new.resort_location), ''), location),
      phone = coalesce(nullif(trim(new.contact_number), ''), phone),
      email = coalesce(nullif(trim(new.resort_email), ''), v_email, email),
      website = coalesce(nullif(trim(new.website_url), ''), website),
      facebook = coalesce(nullif(trim(new.facebook_url), ''), facebook),
      description = coalesce(nullif(trim(new.resort_description), ''), description),
      operator_avatar_path = coalesce(v_avatar_path, operator_avatar_path),
      cover_image_paths = case
        when cardinality(new.cover_image_paths) > 0 then new.cover_image_paths
        else cover_image_paths
      end,
      booking_url = coalesce(new.booking_url, booking_url),
      booking_links = coalesce(new.booking_links, booking_links),
      pcssd_url = coalesce(new.pcssd_url, pcssd_url),
      dot_url = coalesce(new.dot_url, dot_url)
    where id = v_target_est_id;
  else
    -- Insert new establishment for this operator (or update if conflict on operator_id)
    insert into public.establishments (
      name, location, accreditation, phone, email, website, facebook,
      description, accredited, is_claimed, operator_id, operator_avatar_path,
      cover_image_paths, booking_url, booking_links, pcssd_url, dot_url
    ) values (
      new.resort_name,
      new.resort_location,
      'Accredited',
      new.contact_number,
      coalesce(new.resort_email, v_email),
      new.website_url,
      new.facebook_url,
      new.resort_description,
      true,
      true,
      new.tourist_id,
      v_avatar_path,
      coalesce(new.cover_image_paths, '{}'),
      new.booking_url,
      new.booking_links,
      new.pcssd_url,
      new.dot_url
    )
    on conflict (operator_id) do update set
      name = excluded.name,
      location = excluded.location,
      phone = excluded.phone,
      email = excluded.email,
      website = excluded.website,
      facebook = excluded.facebook,
      description = excluded.description,
      operator_avatar_path = excluded.operator_avatar_path,
      cover_image_paths = excluded.cover_image_paths,
      booking_url = excluded.booking_url,
      booking_links = excluded.booking_links,
      pcssd_url = excluded.pcssd_url,
      dot_url = excluded.dot_url,
      is_claimed = true;
  end if;

  return new;
end;
$$;
