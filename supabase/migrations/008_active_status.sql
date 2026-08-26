-- 008_active_status.sql
-- Add 'active' and 'expired' status values to eco_dive_ids

alter table public.eco_dive_ids
  drop constraint if exists eco_dive_ids_status_check;

alter table public.eco_dive_ids
  add constraint eco_dive_ids_status_check
  check (status in ('incomplete', 'complete', 'active', 'expired'));
