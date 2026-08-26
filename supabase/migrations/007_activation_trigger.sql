-- 007_activation_trigger.sql
-- Automatically activate Eco-Dive IDs when divers are added to a manifest

create or replace function public.activate_eco_dive_ids()
returns trigger
language plpgsql
security definer
as $$
declare
  rec record;
begin
  for rec in
    select md.tourist_id, md.manifest_id
    from public.manifest_divers md
    where md.manifest_id in (select distinct manifest_id from new_table)
      and md.tourist_id is not null
      and not md.is_walk_in
  loop
    update public.eco_dive_ids
    set status = 'active', updated_at = now(), activated_at = now(), activated_by_manifest_id = rec.manifest_id
    where tourist_id = rec.tourist_id
      and status != 'active';

    insert into public.notifications (tourist_id, type, title, body, deep_link)
    values (
      rec.tourist_id,
      'eco_dive_activated',
      'Eco-Dive ID Activated',
      'Your Eco-Dive ID has been activated! You are now part of a Dive Manifesto in Mabini.',
      '/eco-dive-id'
    );
  end loop;

  return null;
end;
$$;

create trigger after_manifest_divers_insert_activate
  after insert on public.manifest_divers
  referencing new table as new_table
  for each statement
  execute function public.activate_eco_dive_ids();
