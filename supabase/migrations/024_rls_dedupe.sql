-- 024_rls_dedupe.sql
-- P3 hygiene: 003 ("Operators can view all tourists") and 021
-- ("Operators can search tourists") on public.tourists carry byte-identical
-- USING clauses. Drop the 021 duplicate; the 003 policy (plus the
-- eco_dive_ids policy) continues to gate the add-diver search flow.
-- Apply in Supabase SQL Editor.
drop policy if exists "Operators can search tourists" on public.tourists;
