-- 036_staff_helpers_reconcile.sql
-- Restores the staff RLS helpers when production drifted without them
-- (symptom: row-security violations on writes whose policies look correct,
-- plus 42883 "function public.is_to_staff() does not exist" on direct
-- probe). create or replace = safe whether missing, stale, or current.
-- Also revokes the needless anon grants found on establishments (RLS still
-- blocked anon writes, but the grants were attack surface for no benefit).
-- Idempotent: safe to re-run.
-- Apply in Supabase SQL Editor (service role / postgres).

create or replace function public.is_to_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.to_staff
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function public.is_to_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.to_staff
    where id = auth.uid() and is_active = true and role = 'superadmin'
  );
$$;

-- NOTE: on pre-034 databases (no to_staff.role column) the superadmin
-- helper errors on use, not on creation. That is the correct signal to
-- apply 034 — do not "fix" it by dropping the role predicate.

-- Narrow anon to read-only: the "Anyone can read accredited establishments"
-- policy is an intentional public feature (SELECT stays), but anon has no
-- business holding write privileges — RLS blocks them today, the grants
-- below remove even the attempt surface.
revoke insert, update, delete, truncate on public.establishments from anon;

-- Verification probes (run after applying):
--   select pg_get_functiondef('public.is_to_staff()'::regproc);
--   select pg_get_functiondef('public.is_to_superadmin()'::regproc);
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_schema = 'public' and table_name = 'establishments'
--      and grantee = 'anon';
--
-- Expected: both definitions print; the grants probe returns SELECT (and
-- REFERENCES) only — no INSERT/UPDATE/DELETE/TRUNCATE for anon.
