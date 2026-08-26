create or replace view public.dive_profile_completion as
select
  id as tourist_id,
  case
    when type_of_dive = 'certified' then
      (
        (case when nationality is not null then 1 else 0 end) +
        (case when emergency_contact_name is not null then 1 else 0 end) +
        (case when emergency_contact_number is not null then 1 else 0 end) +
        (case when dive_pass_type is not null then 1 else 0 end) +
        (case when type_of_dive is not null then 1 else 0 end) +
        (case when certification_level is not null then 1 else 0 end) +
        (case when date_accredited is not null then 1 else 0 end) +
        (case when renewal_date is not null then 1 else 0 end)
      ) * 100 / 8
    else
      (
        (case when nationality is not null then 1 else 0 end) +
        (case when emergency_contact_name is not null then 1 else 0 end) +
        (case when emergency_contact_number is not null then 1 else 0 end) +
        (case when dive_pass_type is not null then 1 else 0 end) +
        (case when type_of_dive is not null then 1 else 0 end)
      ) * 100 / 5
  end as completion_pct
from public.tourists;

-- RLS on views uses the underlying table's permissions; no additional policies needed
-- since tourists RLS already restricts to auth.uid() = id
