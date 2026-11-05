-- Add booking_url to establishments and operator_applications

alter table public.establishments
  add column if not exists booking_url text;

alter table public.operator_applications
  add column if not exists booking_url text;

-- Seed sample booking URLs for default demo establishments
update public.establishments
set booking_url = 'https://m.me/AnilaoDiversResort'
where name = 'Anilao Divers Resort' and booking_url is null;

update public.establishments
set booking_url = 'https://www.agoda.com/crystal-blue-resort/hotel/batangas-ph.html'
where name = 'Crystal Blue Resort' and booking_url is null;

-- Update trigger function to sync booking_url
create or replace function public.sync_operator_application_public_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_avatar_path text;
begin
  if new.status <> 'approved' then
    return new;
  end if;

  select t.email, t.avatar_path
  into v_email, v_avatar_path
  from public.tourists t
  where t.id = new.tourist_id;

  insert into public.establishments (
    name, location, accreditation, phone, email, website, facebook, booking_url,
    description, accredited, operator_id, operator_avatar_path,
    cover_image_paths
  ) values (
    new.resort_name, new.resort_location, 'Accredited', new.contact_number,
    coalesce(new.resort_email, v_email), new.website_url, new.facebook_url, new.booking_url,
    new.resort_description, true, new.tourist_id, v_avatar_path,
    coalesce(new.cover_image_paths, '{}')
  )
  on conflict (operator_id) do update set
    name = excluded.name,
    location = excluded.location,
    phone = excluded.phone,
    email = excluded.email,
    website = excluded.website,
    facebook = excluded.facebook,
    booking_url = excluded.booking_url,
    description = excluded.description,
    operator_avatar_path = excluded.operator_avatar_path,
    cover_image_paths = excluded.cover_image_paths;

  return new;
end;
$$;

-- Update save_operator_profile to support p_booking_url
create or replace function public.save_operator_profile(
  p_application_id uuid,
  p_resort_name text,
  p_resort_location text,
  p_resort_description text,
  p_resort_contact_number text,
  p_resort_email text,
  p_facebook_url text,
  p_website_url text,
  p_cover_image_paths text[],
  p_full_name text,
  p_personal_contact_number text,
  p_avatar_path text,
  p_booking_url text default null
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if nullif(trim(p_resort_name), '') is null
    or nullif(trim(p_resort_location), '') is null
    or nullif(trim(p_resort_contact_number), '') is null
    or nullif(trim(p_full_name), '') is null then
    raise exception 'Required profile fields are missing';
  end if;
  if coalesce(cardinality(p_cover_image_paths), 0) > 3 then
    raise exception 'A maximum of three resort photos is allowed';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_cover_image_paths, '{}')) as paths(image_path)
    where image_path not like 'profile-cover/' || auth.uid()::text || '/%'
  ) then
    raise exception 'Invalid resort photo path';
  end if;
  if p_avatar_path is not null
    and p_avatar_path not like 'profile-avatar/' || auth.uid()::text || '/%' then
    raise exception 'Invalid avatar path';
  end if;

  update public.tourists
  set full_name = trim(p_full_name),
      contact_number = nullif(trim(p_personal_contact_number), ''),
      avatar_path = p_avatar_path
  where id = auth.uid();
  if not found then
    raise exception 'Operator account not found';
  end if;

  update public.operator_applications
  set resort_name = trim(p_resort_name),
      resort_location = trim(p_resort_location),
      resort_description = nullif(trim(p_resort_description), ''),
      contact_number = trim(p_resort_contact_number),
      resort_email = nullif(trim(p_resort_email), ''),
      facebook_url = nullif(trim(p_facebook_url), ''),
      website_url = nullif(trim(p_website_url), ''),
      booking_url = nullif(trim(p_booking_url), ''),
      cover_image_paths = coalesce(p_cover_image_paths, '{}')
  where id = p_application_id
    and tourist_id = auth.uid()
    and status = 'approved';
  if not found then
    raise exception 'Approved operator profile not found';
  end if;

  return true;
end;
$$;

grant execute on function public.save_operator_profile(
  uuid, text, text, text, text, text, text, text, text[], text, text, text, text
) to authenticated;
