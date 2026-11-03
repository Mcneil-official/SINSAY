-- Operator-managed resort profiles and public profile media.

alter table public.tourists
  add column if not exists avatar_path text;

alter table public.operator_applications
  add column if not exists resort_description text,
  add column if not exists resort_email text,
  add column if not exists cover_image_paths text[] not null default '{}';

alter table public.establishments
  add column if not exists operator_id uuid references public.tourists(id) on delete set null,
  add column if not exists operator_avatar_path text,
  add column if not exists cover_image_paths text[] not null default '{}';

create unique index if not exists establishments_operator_id_key
  on public.establishments (operator_id);

-- Link existing public listings only when both resort name and location match
-- exactly and the relationship is unambiguous.
with latest_approved as (
  select distinct on (tourist_id)
    tourist_id, resort_name, resort_location, contact_number, resort_description,
    resort_email, facebook_url, website_url, cover_image_paths
  from public.operator_applications
  where status = 'approved'
  order by tourist_id, created_at desc
), pairs as (
  select a.tourist_id, e.id as establishment_id
  from latest_approved a
  join public.establishments e
    on e.name = a.resort_name and e.location = a.resort_location
), unique_pairs as (
  select p.tourist_id, p.establishment_id
  from pairs p
  where (select count(*) from pairs p2 where p2.tourist_id = p.tourist_id) = 1
    and (select count(*) from pairs p2 where p2.establishment_id = p.establishment_id) = 1
)
update public.establishments e
set operator_id = p.tourist_id
from unique_pairs p
where e.id = p.establishment_id
  and e.operator_id is null
  and not exists (
    select 1 from public.establishments owned where owned.operator_id = p.tourist_id
  );

-- Preserve useful public listing details as initial profile values when the
-- approved application did not collect them.
update public.operator_applications oa
set resort_description = coalesce(oa.resort_description, e.description),
    resort_email = coalesce(oa.resort_email, e.email),
    facebook_url = coalesce(oa.facebook_url, e.facebook),
    website_url = coalesce(oa.website_url, e.website)
from public.establishments e
where e.operator_id = oa.tourist_id
  and oa.status = 'approved';

-- Ensure each already-approved operator has a public listing. Existing rows
-- that could not be safely linked remain untouched.
with latest_approved as (
  select distinct on (oa.tourist_id)
    oa.tourist_id, oa.resort_name, oa.resort_location, oa.contact_number,
    oa.resort_description, oa.resort_email, oa.facebook_url, oa.website_url,
    oa.cover_image_paths, t.avatar_path, t.email
  from public.operator_applications oa
  join public.tourists t on t.id = oa.tourist_id
  where oa.status = 'approved'
  order by oa.tourist_id, oa.created_at desc
)
insert into public.establishments (
  name, location, accreditation, phone, email, website, facebook, description,
  accredited, operator_id, operator_avatar_path, cover_image_paths
)
select
  a.resort_name, a.resort_location, 'Accredited', a.contact_number,
  coalesce(a.resort_email, a.email), a.website_url, a.facebook_url,
  a.resort_description, true, a.tourist_id, a.avatar_path, a.cover_image_paths
from latest_approved a
where not exists (
  select 1 from public.establishments e where e.operator_id = a.tourist_id
);

-- Future approved applications are created/updated from the operator's
-- application profile. The application remains the source of resort details.
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
    name, location, accreditation, phone, email, website, facebook,
    description, accredited, operator_id, operator_avatar_path,
    cover_image_paths
  ) values (
    new.resort_name, new.resort_location, 'Accredited', new.contact_number,
    coalesce(new.resort_email, v_email), new.website_url, new.facebook_url,
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
    description = excluded.description,
    operator_avatar_path = excluded.operator_avatar_path,
    cover_image_paths = excluded.cover_image_paths;

  return new;
end;
$$;

drop trigger if exists sync_operator_application_public_listing
  on public.operator_applications;
create trigger sync_operator_application_public_listing
  after insert or update
  on public.operator_applications
  for each row execute function public.sync_operator_application_public_listing();

create or replace function public.sync_operator_avatar_public_listing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.avatar_path is distinct from old.avatar_path then
    update public.establishments
    set operator_avatar_path = new.avatar_path
    where operator_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_operator_avatar_public_listing on public.tourists;
create trigger sync_operator_avatar_public_listing
  after update of avatar_path on public.tourists
  for each row execute function public.sync_operator_avatar_public_listing();

drop policy if exists "Operators update own approved profile"
  on public.operator_applications;
create policy "Operators update own approved profile"
  on public.operator_applications for update
  using (auth.uid() = tourist_id and status = 'approved')
  with check (auth.uid() = tourist_id and status = 'approved');

-- Atomic profile update for the personal account and resort application.
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
  p_avatar_path text
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
  uuid, text, text, text, text, text, text, text, text[], text, text, text
) to authenticated;

-- Public profile photos are readable by tourists; writes remain scoped to the
-- authenticated operator's own profile folders.
insert into storage.buckets (
  id, name, public, allowed_mime_types, file_size_limit
)
values (
  'operator_media', 'operator_media', true,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], 5242880
)
on conflict (id) do update set
  public = true,
  allowed_mime_types = excluded.allowed_mime_types,
  file_size_limit = excluded.file_size_limit;

drop policy if exists "Public read operator profile media" on storage.objects;
create policy "Public read operator profile media"
  on storage.objects for select
  using (bucket_id = 'operator_media');

drop policy if exists "Operators upload own profile media" on storage.objects;
create policy "Operators upload own profile media"
  on storage.objects for insert
  with check (
    bucket_id = 'operator_media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[2] = auth.uid()::text
    and (storage.foldername(name))[1] in ('profile-cover', 'profile-avatar')
  );

drop policy if exists "Operators delete own profile media" on storage.objects;
create policy "Operators delete own profile media"
  on storage.objects for delete
  using (
    bucket_id = 'operator_media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[2] = auth.uid()::text
    and (storage.foldername(name))[1] in ('profile-cover', 'profile-avatar')
  );
