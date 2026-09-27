-- 029_annual_price.sql
-- Seeds the Annual Dive Pass pricing row (TO-confirmed: ₱2000, valid 1 year
-- from the dive date). Idempotent: safe to re-run; never overwrites a
-- TO-edited price.
-- Requires 026 (code column). Apply in Supabase SQL Editor (service role).

insert into public.pass_pricing (label, passes, price, description, sort_order, code)
select 'Annual Dive Pass', 1, 2000, 'Valid for one year from the dive date', 2, 'annual'
where not exists (select 1 from public.pass_pricing where code = 'annual');
