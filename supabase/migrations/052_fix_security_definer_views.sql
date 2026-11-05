-- 052_fix_security_definer_views.sql
-- Resolves Supabase Security Advisor alert: "View defined with SECURITY DEFINER property"
-- Sets security_invoker = true so PostgreSQL views enforce the querying user's RLS policies.

-- 1. Recreate to_tourism_preference_analytics with security_invoker = true
create or replace view public.to_tourism_preference_analytics
with (security_invoker = true) as
select
  coalesce(preferred_activities, 'Unspecified') as preferred_activities,
  coalesce(length_of_stay, 'Unspecified') as length_of_stay,
  count(*)::integer as total_requests,
  round(avg(coalesce(group_size, 1)), 1) as avg_group_size,
  date_trunc('month', created_at) as request_month
from public.dive_plan_inputs
group by coalesce(preferred_activities, 'Unspecified'), coalesce(length_of_stay, 'Unspecified'), date_trunc('month', created_at);

-- Explicitly set attribute for Postgres 15+
alter view public.to_tourism_preference_analytics set (security_invoker = true);

-- 2. Secure dive_profile_completion view as security_invoker
alter view if exists public.dive_profile_completion set (security_invoker = true);

-- 3. Re-affirm operator_pass_ledger as security_invoker
alter view if exists public.operator_pass_ledger set (security_invoker = true);

-- 4. Tighten view access permissions
revoke all on public.to_tourism_preference_analytics from anon;
grant select on public.to_tourism_preference_analytics to authenticated;
