-- 065_tourist_onboarding_completed.sql
-- Add onboarding_completed column to public.tourists
alter table public.tourists 
add column if not exists onboarding_completed boolean not null default false;

-- Backfill all existing registered tourists so existing users never see onboarding again
update public.tourists 
set onboarding_completed = true 
where onboarding_completed is false;
