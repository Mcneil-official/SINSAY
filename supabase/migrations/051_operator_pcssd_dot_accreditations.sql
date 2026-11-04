-- 051_operator_pcssd_dot_accreditations.sql
-- Add PCSSD and DOT certification columns to operator applications and establishments

-- 1. Operator applications
alter table public.operator_applications
  add column if not exists pcssd_url text,
  add column if not exists dot_url text;

comment on column public.operator_applications.pcssd_url is 'Storage path or URL to PCSSD accreditation certificate';
comment on column public.operator_applications.dot_url is 'Storage path or URL to DOT certification document';

-- Backfill existing applications if any
update public.operator_applications
set pcssd_url = pcss_url
where pcssd_url is null and pcss_url is not null;

-- 2. Establishments accreditation badges and document URLs
alter table public.establishments
  add column if not exists is_pcssd_accredited boolean not null default false,
  add column if not exists is_dot_accredited boolean not null default false,
  add column if not exists pcssd_url text,
  add column if not exists dot_url text;

comment on column public.establishments.is_pcssd_accredited is 'Indicates whether the establishment holds PCSSD accreditation';
comment on column public.establishments.is_dot_accredited is 'Indicates whether the establishment holds DOT certification';

-- Seed / initial accredited establishments are marked as holding both badges
update public.establishments
set is_pcssd_accredited = true,
    is_dot_accredited = true
where accredited = true;

-- 3. Update public listing sync trigger
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

  v_pcssd := coalesce(new.pcssd_url, new.pcss_url);
  v_has_pcssd := (v_pcssd is not null and v_pcssd <> '');
  v_has_dot := (new.dot_url is not null and new.dot_url <> '');

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
    v_pcssd, new.dot_url
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

-- 4. Storage RLS policy update for operator_uploads (permits, pcss, pcssd, dot)
drop policy if exists "Users can read own application files" on storage.objects;
create policy "Users can read own application files"
  on storage.objects for select
  using (
    bucket_id = 'operator_uploads'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] = 'permits'
      or (storage.foldername(name))[1] = 'pcss'
      or (storage.foldername(name))[1] = 'pcssd'
      or (storage.foldername(name))[1] = 'dot'
    )
    and (storage.foldername(name))[2] = auth.uid()::text
  );
