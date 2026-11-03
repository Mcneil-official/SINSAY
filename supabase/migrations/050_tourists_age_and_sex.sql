-- 050_tourists_age_and_sex.sql
-- Add age and sex columns to the tourists table

alter table public.tourists
  add column if not exists age integer check (age is null or (age >= 1 and age <= 120)),
  add column if not exists sex text check (sex is null or sex in ('male', 'female', 'other', 'prefer_not_to_say'));

comment on column public.tourists.age is 'User age in years (1-120)';
comment on column public.tourists.sex is 'User sex/gender (male, female, other, prefer_not_to_say)';
