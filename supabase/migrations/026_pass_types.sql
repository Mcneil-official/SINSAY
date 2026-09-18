-- 026_pass_types.sql
-- Two pass types (one-day + annual) with TO-editable pricing. Replaces the
-- 10/25/50 bulk tiers seeded in 022. Safe: the ledger reads inventory and
-- payment_transactions, never pass_pricing, so existing operator balances
-- are untouched by deleting bulk rows.
-- Apply in Supabase SQL Editor (service role / postgres).

alter table public.pass_pricing
  add column if not exists code text;

-- Backfill pre-026 rows so the column is never null going forward.
update public.pass_pricing set code = 'bulk' where code is null;

-- Replace bulk tiers with the one-day pass (TO may re-price in dashboard).
delete from public.pass_pricing where code = 'bulk';

insert into public.pass_pricing (label, passes, price, description, sort_order, code)
select 'One-Day Dive Pass', 1, 150, 'Valid for a single dive day', 1, 'one_day'
where not exists (select 1 from public.pass_pricing where code = 'one_day');

-- Annual row is intentionally NOT seeded: the TO inserts it via dashboard
-- once the price is decided. The client treats a missing annual row as
-- "not yet available".
