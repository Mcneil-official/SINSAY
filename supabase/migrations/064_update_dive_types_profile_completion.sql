-- 064_update_dive_types_profile_completion.sql
-- Update dive_profile_completion view to align with the 2-option model:
-- 1. "fun-intro-guest" (or fun/intro/guest legacy): 100% complete based on 4 personal/contact fields.
-- 2. "instructor-master" (or dive-master/certified legacy): 100% complete based on 5 fields (including accreditation/permit).

create or replace view public.dive_profile_completion as
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
