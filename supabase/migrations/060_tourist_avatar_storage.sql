-- 060_tourist_avatar_storage.sql
-- Ensure tourists and operators can manage their own profile avatars in public operator_media bucket.

alter table public.tourists
  add column if not exists avatar_path text;

-- Ensure operator_media bucket exists, is public for CDN reads, and accepts image types up to 5MB
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

-- 1. Public can read profile media (avatars, covers)
drop policy if exists "Public read operator profile media" on storage.objects;
create policy "Public read operator profile media"
  on storage.objects for select
  using (bucket_id = 'operator_media');

-- 2. Authenticated users (tourists and operators) can upload their own profile avatar and covers
drop policy if exists "Users upload own profile media" on storage.objects;
drop policy if exists "Operators upload own profile media" on storage.objects;
create policy "Users upload own profile media"
  on storage.objects for insert
  with check (
    bucket_id = 'operator_media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[2] = auth.uid()::text
    and (storage.foldername(name))[1] in ('profile-cover', 'profile-avatar')
  );

-- 3. Authenticated users can update/upsert their own profile avatar and covers
drop policy if exists "Users update own profile media" on storage.objects;
create policy "Users update own profile media"
  on storage.objects for update
  using (
    bucket_id = 'operator_media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[2] = auth.uid()::text
    and (storage.foldername(name))[1] in ('profile-cover', 'profile-avatar')
  )
  with check (
    bucket_id = 'operator_media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[2] = auth.uid()::text
    and (storage.foldername(name))[1] in ('profile-cover', 'profile-avatar')
  );

-- 4. Authenticated users can delete their own profile avatar and covers
drop policy if exists "Users delete own profile media" on storage.objects;
drop policy if exists "Operators delete own profile media" on storage.objects;
create policy "Users delete own profile media"
  on storage.objects for delete
  using (
    bucket_id = 'operator_media'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[2] = auth.uid()::text
    and (storage.foldername(name))[1] in ('profile-cover', 'profile-avatar')
  );
