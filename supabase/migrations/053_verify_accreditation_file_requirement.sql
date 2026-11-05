-- 053_verify_accreditation_file_requirement.sql
-- Enforces that accreditation badges are strictly backed by uploaded certification files in the database.

-- 1. Sync any existing operator application uploads to establishments
update public.establishments e
set
  pcssd_url = coalesce(e.pcssd_url, oa.pcssd_url, oa.pcss_url),
  dot_url = coalesce(e.dot_url, oa.dot_url)
from public.operator_applications oa
where e.operator_id = oa.tourist_id;

-- 2. Strictly set is_pcssd_accredited = true ONLY when a valid pcssd_url exists
update public.establishments
set is_pcssd_accredited = (pcssd_url is not null and trim(pcssd_url) <> '');

-- 3. Strictly set is_dot_accredited = true ONLY when a valid dot_url exists
update public.establishments
set is_dot_accredited = (dot_url is not null and trim(dot_url) <> '');

-- 4. Re-verify trigger sync_operator_application_public_listing enforces non-empty URLs
create or replace function public.sync_operator_application_public_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_avatar_path text;
  v_pcssd text;
  v_has_pcssd boolean;
  v_has_dot boolean;
begin
  if new.status <> 'approved' then
    return new;
  end if;

  select t.email, t.avatar_path
  into v_email, v_avatar_path
  from public.tourists t
  where t.id = new.tourist_id;

  v_pcssd := nullif(trim(coalesce(new.pcssd_url, new.pcss_url)), '');
  v_has_pcssd := (v_pcssd is not null);
  v_has_dot := (new.dot_url is not null and trim(new.dot_url) <> '');

  insert into public.establishments (
    name, location, accreditation, phone, email, website, facebook,
    description, accredited, operator_id, operator_avatar_path,
    cover_image_paths, is_pcssd_accredited, is_dot_accredited,
    pcssd_url, dot_url
  ) values (
    new.resort_name, new.resort_location, 'Accredited', new.contact_number,
    coalesce(new.resort_email, v_email), new.website_url, new.facebook_url,
    new.resort_description, true, new.tourist_id, v_avatar_path,
    coalesce(new.cover_image_paths, '{}'),
    v_has_pcssd, v_has_dot,
    v_pcssd, nullif(trim(new.dot_url), '')
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
    is_pcssd_accredited = excluded.is_pcssd_accredited,
    is_dot_accredited = excluded.is_dot_accredited,
    pcssd_url = excluded.pcssd_url,
    dot_url = excluded.dot_url;

  return new;
end;
$$;
