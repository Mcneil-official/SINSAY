-- 056_update_profile_completion_view.sql
-- Update dive_profile_completion view to remove dive_pass_type, date_accredited, and renewal_date requirements

create or replace view public.dive_profile_completion as
select
  id as tourist_id,
  case
    when type_of_dive = 'certified' then
      (
        (case when nationality is not null then 1 else 0 end) +
        (case when emergency_contact_name is not null then 1 else 0 end) +
        (case when emergency_contact_number is not null then 1 else 0 end) +
        (case when type_of_dive is not null then 1 else 0 end) +
        (case when certification_level is not null then 1 else 0 end)
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
