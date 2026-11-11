-- Remove the temporary full-name uniqueness checks; Supabase Auth enforces unique emails.
drop trigger if exists reject_duplicate_registration_name on public.tourists;

drop function if exists public.reject_duplicate_registration_name();
drop function if exists public.is_full_name_available(text);
drop function if exists public.normalize_registration_name(text);
