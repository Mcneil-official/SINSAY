-- Add language preference column to tourists
alter table public.tourists add column if not exists language_preference text not null default 'en' check (language_preference in ('en', 'fil'));
