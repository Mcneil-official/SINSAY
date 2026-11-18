-- ============================================
-- SINSAY Migration 078 — Fix and Harden Registration handle_new_user() Trigger
-- ============================================
--
-- Fixes "Database error saving new user" during registration by:
-- 1. Safely cleaning up legacy name uniqueness triggers/functions on tourists
-- 2. Ensuring public.eco_id_seq exists, is granted to all roles, and is synchronized above any existing eco_id_numbers
-- 3. Providing a fail-safe, idempotent handle_new_user() function with ON CONFLICT resolution and exception handling
-- 4. Re-binding the on_auth_user_created trigger on auth.users

-- ── 1. Drop any lingering problematic triggers & functions on public.tourists ──
drop trigger if exists reject_duplicate_registration_name on public.tourists;
drop function if exists public.reject_duplicate_registration_name();
drop function if exists public.is_full_name_available(text);
drop function if exists public.normalize_registration_name(text);

-- ── 2. Sequence setup & permissions for Eco-Dive IDs ──
create sequence if not exists public.eco_id_seq start with 100001;
grant usage, select on sequence public.eco_id_seq to anon, authenticated, service_role, postgres;

-- Synchronize sequence with existing eco_dive_ids records to avoid collisions
do $$
declare
  v_max int;
begin
  select coalesce(max(nullif(substring(eco_id_number from '[0-9]+$'), '')::integer), 100000)
  into v_max
  from public.eco_dive_ids;

  if v_max >= 100001 then
    perform setval('public.eco_id_seq', v_max + 1, false);
  end if;
exception when others then
  null;
end $$;

-- ── 3. Hardened, fail-safe handle_new_user() trigger function ──
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_eco_number text;
begin
  -- Step 1: Insert or update tourist profile
  begin
    insert into public.tourists (
      id,
      email,
      full_name,
      onboarding_completed,
      status,
      language_preference
    )
    values (
      new.id,
      new.email,
      coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1), 'Diver'),
      false,
      'Active',
      'en'
    )
    on conflict (id) do update set
      email = excluded.email,
      full_name = coalesce(public.tourists.full_name, excluded.full_name);
  exception when others then
    raise warning 'handle_new_user: failed to insert tourists row for %: %', new.id, sqlerrm;
  end;

  -- Step 2: Auto-provision eco_dive_ids row
  begin
    begin
      v_eco_number := 'ECO-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.eco_id_seq')::text, 6, '0');
    exception when others then
      v_eco_number := 'ECO-' || to_char(now(), 'YYYY') || '-' || floor(100000 + random() * 900000)::text;
    end;

    insert into public.eco_dive_ids (tourist_id, eco_id_number, status)
    values (new.id, v_eco_number, 'incomplete')
    on conflict (tourist_id) do nothing;
  exception when others then
    raise warning 'handle_new_user: failed to insert eco_dive_ids row for %: %', new.id, sqlerrm;
  end;

  return new;
exception when others then
  -- Fail-safe: NEVER abort the auth.users signup transaction.
  -- AuthContext on the client auto-provisions missing rows on login.
  raise warning 'handle_new_user: unexpected error for % (%): %', new.id, new.email, sqlerrm;
  return new;
end;
$$;

-- ── 4. Re-bind trigger on auth.users ──
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
