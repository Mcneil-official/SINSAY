-- 055_diver_master_credentials.sql
-- Add PCSSD Accreditation and Permit to Operate columns to tourists table for dive professionals (Dive Masters & Instructors)

alter table public.tourists
  add column if not exists pcssd_url text,
  add column if not exists pcssd_accreditation_no text,
  add column if not exists permit_to_operate_url text,
  add column if not exists permit_to_operate_no text;

comment on column public.tourists.pcssd_url is 'Storage path or URL to PCSSD accreditation certificate';
comment on column public.tourists.pcssd_accreditation_no is 'Official PCSSD accreditation ID or number';
comment on column public.tourists.permit_to_operate_url is 'Storage path or URL to LGU/MTO municipal permit to operate';
comment on column public.tourists.permit_to_operate_no is 'Official Permit to Operate license or registration number';

-- Fast search indexes for manifest diver and dive master lookups
create index if not exists idx_tourists_cert_level on public.tourists(certification_level);
create index if not exists idx_tourists_full_name on public.tourists(full_name);

-- Update storage policies for tourist_uploads to support pcssd and permits folders
do $$
begin
  -- Ensure authenticated users can read own pcssd and permits files in tourist_uploads
  drop policy if exists "Users can read own tourist files" on storage.objects;
  create policy "Users can read own tourist files"
    on storage.objects for select
    using (
      bucket_id = 'tourist_uploads'
      and auth.role() = 'authenticated'
      and (
        (storage.foldername(name))[1] = auth.uid()::text
        or (storage.foldername(name))[2] = auth.uid()::text
      )
    );

  -- Operators can view tourist certification & accreditation documents for manifest verification
  drop policy if exists "Operators can view tourist credentials" on storage.objects;
  create policy "Operators can view tourist credentials"
    on storage.objects for select
    using (
      bucket_id = 'tourist_uploads'
      and auth.role() = 'authenticated'
      and exists (
        select 1 from public.operator_applications
        where tourist_id = auth.uid()
          and status = 'approved'
      )
    );
end $$;
