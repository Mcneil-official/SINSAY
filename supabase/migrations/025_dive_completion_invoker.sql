-- 025_dive_completion_invoker.sql
-- Fix "Security Definer View" lint on public.dive_profile_completion.
-- The view (016) selects all rows from public.tourists with no auth.uid()
-- filter; without security_invoker it runs with the view owner's privileges
-- and bypasses the querying user's RLS. The comment in 016 claiming RLS is
-- inherited only holds for security-invoker views — hence this fix.
-- Same pattern as 020 (operator_pass_ledger).
-- Apply in Supabase SQL Editor (service role / postgres).

alter view public.dive_profile_completion set (security_invoker = true);
grant select on public.dive_profile_completion to authenticated;
