-- 061_tourist_dive_history_rls.sql
-- Enable tourists to query their own manifest participation and manifest details

-- 1. Policy on manifest_divers for tourists
drop policy if exists "Tourists can view own manifest participation" on public.manifest_divers;
create policy "Tourists can view own manifest participation"
  on public.manifest_divers for select
  using (
    tourist_id = auth.uid()
    or (
      eco_id is not null
      and exists (
        select 1 from public.eco_dive_ids e
        where e.eco_id_number = manifest_divers.eco_id
          and e.tourist_id = auth.uid()
      )
    )
  );

-- 2. Policy on dive_manifests for tourists
drop policy if exists "Tourists can view manifests they participated in" on public.dive_manifests;
create policy "Tourists can view manifests they participated in"
  on public.dive_manifests for select
  using (
    exists (
      select 1 from public.manifest_divers md
      where md.manifest_id = dive_manifests.id
        and (
          md.tourist_id = auth.uid()
          or (
            md.eco_id is not null
            and exists (
              select 1 from public.eco_dive_ids e
              where e.eco_id_number = md.eco_id
                and e.tourist_id = auth.uid()
            )
          )
        )
    )
  );
