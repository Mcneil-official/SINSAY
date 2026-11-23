-- 076_establishment_photo_url.sql
-- Ensure photo_url column exists on public.establishments to support internet links and photo URLs alongside image_url and cover_image_paths.

alter table public.establishments
  add column if not exists photo_url text;
