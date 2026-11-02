-- 048_pass_authorization_hardening.sql
-- Prevent client-side users from minting verified payments or annual slots.
-- Payment orders and annual assignments are created by trusted SECURITY DEFINER
-- RPCs (040_phase_a_writes.sql), while authenticated clients retain read access.

-- A payment can only become verified through a trusted staff/server workflow.
-- create_buy_pass_order() inserts pending transactions as SECURITY DEFINER.
revoke insert, update, delete on public.payment_transactions from anon, authenticated;

-- Annual holders are assigned atomically by create_manifest_with_divers().
-- Clients may read coverage through the existing RLS policies, but cannot
-- create, alter, or remove slot assignments directly.
revoke insert, update, delete on public.annual_pass_holders from anon, authenticated;

grant select on public.payment_transactions to authenticated;
grant select on public.annual_pass_holders to authenticated;
