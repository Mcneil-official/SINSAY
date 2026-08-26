-- 005_manifest_capacity_trigger.sql
-- Enforce manifest_divers.count <= dive_manifests.max_divers

-- Function: check that inserted divers don't exceed the manifest's max capacity
create or replace function public.check_manifest_diver_capacity()
returns trigger
language plpgsql
as $$
declare
  rec record;
  v_total integer;
begin
  for rec in
    select dm.id, dm.max_divers
    from public.dive_manifests dm
    where dm.id in (select distinct manifest_id from new_table)
  loop
    select count(*) into v_total
    from public.manifest_divers
    where manifest_id = rec.id;

    if v_total > rec.max_divers then
      raise exception 'Manifest % capacity exceeded: max_divers is %, but total divers is %',
        rec.id, rec.max_divers, v_total;
    end if;
  end loop;

  return null;
end;
$$;

-- Trigger: fires once after each INSERT statement on manifest_divers
create trigger check_manifest_diver_capacity_trigger
  after insert on public.manifest_divers
  referencing new table as new_table
  for each statement
  execute function public.check_manifest_diver_capacity();
