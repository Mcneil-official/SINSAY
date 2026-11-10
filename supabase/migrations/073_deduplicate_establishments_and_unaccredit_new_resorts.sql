-- 073_deduplicate_establishments_and_unaccredit_new_resorts.sql
-- 1) Removes duplicate unclaimed directory listings created by multi-run seeds.
-- 2) Adds a partial unique index so unclaimed listings can never duplicate again.
-- 3) Clears the "Accredited" badge text from unclaimed pre-populated resorts
--    (they are public directory listings that have not been TO-accredited).
--    `accredited = true` is preserved so RLS keeps them publicly readable.

-- 1. Deduplicate unclaimed rows ------------------------------------------------
-- Keeper preference per resort name: claimed rows first (a claimed twin always
-- wins), then newest created_at, then highest id. Claimed rows are never deleted.
with ranked as (
  select id,
         first_value(id) over (
           partition by lower(trim(name))
           order by (operator_id is not null or coalesce(is_claimed, false)) desc,
                    created_at desc,
                    id desc
         ) as keeper_id
  from public.establishments
)
-- Re-point pending claim applications off doomed rows first
-- (operator_applications.establishment_id is ON DELETE SET NULL).
update public.operator_applications oa
set establishment_id = r.keeper_id
from ranked r
where oa.establishment_id = r.id
  and r.id <> r.keeper_id;

with ranked as (
  select id,
         first_value(id) over (
           partition by lower(trim(name))
           order by (operator_id is not null or coalesce(is_claimed, false)) desc,
                    created_at desc,
                    id desc
         ) as keeper_id
  from public.establishments
)
-- Delete only unclaimed losers; claimed (operator-owned) rows are never deleted.
delete from public.establishments e
using ranked r
where e.id = r.id
  and e.id <> r.keeper_id
  and e.operator_id is null
  and coalesce(e.is_claimed, false) = false;

-- 2. Prevent future duplicates among unclaimed directory listings ---------------
-- Partial scope: operator inserts from the claim trigger are always
-- is_claimed = true with operator_id set, so they never touch this index and
-- application approvals cannot fail with a unique violation.
create unique index if not exists idx_establishments_unique_unclaimed_name
  on public.establishments (lower(trim(name)))
  where operator_id is null and coalesce(is_claimed, false) = false;

-- 3. Remove "Accredited" badge from unclaimed pre-populated resorts -------------
-- accreditation (text) drives the UI badge; accredited (boolean) drives RLS
-- public read. Only the badge is cleared here.
update public.establishments
set accreditation = null
where operator_id is null or coalesce(is_claimed, false) = false;
