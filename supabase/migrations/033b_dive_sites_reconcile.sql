-- 033b_dive_sites_reconcile.sql
-- Reconciles production dive_sites tables that predate the full 033 spec
-- (e.g. missing 'barangay' → PostgREST PGRST204 on insert). Adds every
-- 033 column that isn't there yet, WITHOUT touching existing data.
--
-- Deliberately lenient (nullable, no checks/defaults): on a table that
-- already holds rows, NOT NULL / UNIQUE / CHECK additions can fail. The
-- dashboard renders missing values as "—" and requires real values on
-- add/edit going forward. If you want the full strict spec afterwards
-- (defaults, checks, unique), backfill values first, then apply 033's
-- column definitions manually.
--
-- Idempotent: every statement is IF NOT EXISTS — safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres).

alter table public.dive_sites add column if not exists site_code text;
alter table public.dive_sites add column if not exists name text;
alter table public.dive_sites add column if not exists barangay text;
alter table public.dive_sites add column if not exists depth_range text;
alter table public.dive_sites add column if not exists difficulty text;
alter table public.dive_sites add column if not exists site_type text;
alter table public.dive_sites add column if not exists status text;
alter table public.dive_sites add column if not exists description text;
alter table public.dive_sites add column if not exists photo_url text;
alter table public.dive_sites add column if not exists lat double precision;
alter table public.dive_sites add column if not exists lng double precision;
alter table public.dive_sites add column if not exists created_at timestamptz;
alter table public.dive_sites add column if not exists updated_at timestamptz;

-- Verification probe (run after applying — every 033 column must appear):
--   select column_name, data_type from information_schema.columns
--    where table_schema = 'public' and table_name = 'dive_sites'
--    order by ordinal_position;
--
-- Then retry the dashboard add. Note: PostgREST caches the schema — if the
-- first retry still complains about the column, wait ~1 minute and retry
-- once more before reporting back.
