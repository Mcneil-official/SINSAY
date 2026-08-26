-- 004_private_storage.sql
-- Switch storage buckets to private with MIME allowlist and file size limits

-- 1. Set both buckets to private
update storage.buckets
set public = false
where id in ('tourist_uploads', 'operator_uploads');

-- 2. Set allowed MIME types and file size limits on operator_uploads
--    (image/*, application/pdf, max 5MB)
update storage.buckets
set
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  file_size_limit = 5242880  -- 5MB
where id = 'operator_uploads';

-- 3. Same for tourist_uploads
update storage.buckets
set
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  file_size_limit = 5242880
where id = 'tourist_uploads';

-- 4. Storage RLS: enable on storage.objects (disabled by default)
alter table storage.objects enable row level security;

-- 5. Allow authenticated users to upload to operator_uploads
create policy "Authenticated can upload operator files"
  on storage.objects for insert
  with check (
    bucket_id = 'operator_uploads'
    and auth.role() = 'authenticated'
  );

-- 6. Allow authenticated users to read their own operator files
--    (path-based check: first folder segment must match their user ID)
create policy "Users can read own operator files"
  on storage.objects for select
  using (
    bucket_id = 'operator_uploads'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = 'receipts'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- 7. Same for permits and pcss folders (operator uploads, split by subfolder)
create policy "Users can read own application files"
  on storage.objects for select
  using (
    bucket_id = 'operator_uploads'
    and auth.role() = 'authenticated'
    and (
      (storage.foldername(name))[1] = 'permits'
      or (storage.foldername(name))[1] = 'pcss'
    )
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- 8. Allow authenticated users to upload to tourist_uploads
create policy "Authenticated can upload tourist files"
  on storage.objects for insert
  with check (
    bucket_id = 'tourist_uploads'
    and auth.role() = 'authenticated'
  );

-- 9. Allow users to read their own tourist files
create policy "Users can read own tourist files"
  on storage.objects for select
  using (
    bucket_id = 'tourist_uploads'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
