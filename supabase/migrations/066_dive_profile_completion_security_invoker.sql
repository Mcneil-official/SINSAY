-- 066_dive_profile_completion_security_invoker.sql
-- Resolves Supabase Security Advisor alert: "View public.dive_profile_completion is defined with the SECURITY DEFINER property"
-- Sets security_invoker = true so PostgreSQL views enforce the querying user's Row Level Security (RLS) policies.

create or replace view public.dive_profile_completion
with (security_invoker = true) as
select
  id as tourist_id,
  case
    when type_of_dive in ('instructor-master', 'dive-master', 'certified') then
      (
        (case when nationality is not null then 1 else 0 end) +
        (case when emergency_contact_name is not null then 1 else 0 end) +
        (case when emergency_contact_number is not null then 1 else 0 end) +
        (case when type_of_dive is not null then 1 else 0 end) +
        (case when (pcssd_accreditation_no is not null or pcssd_url is not null)
               and (permit_to_operate_no is not null or permit_to_operate_url is not null)
              then 1 else 0 end)
      ) * 100 / 5
    else
      (
        (case when nationality is not null then 1 else 0 end) +
        (case when emergency_contact_name is not null then 1 else 0 end) +
        (case when emergency_contact_number is not null then 1 else 0 end) +
        (case when type_of_dive is not null then 1 else 0 end)
      ) * 100 / 4
  end as completion_pct
from public.tourists;

-- Explicitly enforce security_invoker on all views
alter view if exists public.dive_profile_completion set (security_invoker = true);
alter view if exists public.operator_pass_ledger set (security_invoker = true);
alter view if exists public.to_tourism_preference_analytics set (security_invoker = true);

-- Grant select to authenticated users
grant select on public.dive_profile_completion to authenticated;
