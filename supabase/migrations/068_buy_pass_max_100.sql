-- 068_buy_pass_max_100.sql
-- Raise dive pass purchase maximum quantity from 50 to 100 in dive_pass_inventory and create_buy_pass_order RPC.

-- 1. Update check constraint on dive_pass_inventory table
alter table public.dive_pass_inventory
  drop constraint if exists chk_total_passes_1_50,
  drop constraint if exists chk_total_passes_1_100;

alter table public.dive_pass_inventory
  add constraint chk_total_passes_1_100
  check (total_passes between 1 and 100);

-- 2. Update create_buy_pass_order RPC
create or replace function public.create_buy_pass_order(
  p_pass_type text,
  p_pass_label text,
  p_total_passes integer,
  p_amount numeric,
  p_reference_number text,
  p_receipt_path text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_operator uuid := auth.uid();
  v_ref text;
  v_inventory_id uuid;
begin
  if v_operator is null then
    raise exception 'Not authenticated';
  end if;
  if p_pass_type not in ('single', 'multi', 'annual') then
    raise exception 'Invalid pass_type %', p_pass_type;
  end if;
  if p_total_passes is null or p_total_passes < 1 or p_total_passes > 100 then
    raise exception 'total_passes must be between 1 and 100';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'amount must be positive';
  end if;
  v_ref := regexp_replace(coalesce(p_reference_number, ''), '\D', '', 'g');
  if v_ref !~ '^\d{13}$' then
    raise exception 'reference_number must be 13 digits';
  end if;
  if p_receipt_path is null or p_receipt_path = '' then
    raise exception 'receipt path is required';
  end if;

  insert into public.dive_pass_inventory
    (operator_id, pass_type, pass_label, total_passes, remaining_passes, amount)
  values
    (v_operator, p_pass_type, coalesce(nullif(p_pass_label, ''), 'Dive Pass'),
     p_total_passes, p_total_passes, p_amount)
  returning id into v_inventory_id;

  insert into public.payment_transactions
    (operator_id, dive_pass_inventory_id, amount, reference_number, receipt_url, status)
  values
    (v_operator, v_inventory_id, p_amount, v_ref, p_receipt_path, 'pending');

  return v_inventory_id;
exception
  when unique_violation then
    raise exception 'This GCash reference number was already submitted';
end;
$$;

grant execute on function public.create_buy_pass_order(text, text, integer, numeric, text, text) to authenticated;
