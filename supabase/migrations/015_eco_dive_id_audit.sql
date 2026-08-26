alter table public.eco_dive_ids
  add column if not exists activated_at timestamptz,
  add column if not exists activated_by_manifest_id uuid references public.dive_manifests(id) on delete set null;
