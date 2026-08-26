-- ============================================
-- SINSAY Migration P7.3 — Captain Name Column
-- ============================================

alter table public.dive_manifests
  add column if not exists captain_name text;
