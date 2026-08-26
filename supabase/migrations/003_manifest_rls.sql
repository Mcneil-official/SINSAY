-- ============================================
-- SINSAY Migration B5 — Manifest RLS Policies
-- ============================================

-- Allow approved operators to view all tourists (for diver search)
create policy "Operators can view all tourists"
  on public.tourists for select
  using (
    exists (
      select 1 from public.operator_applications
      where tourist_id = auth.uid() and status = 'approved'
    )
  );

-- Allow approved operators to view all eco-dive IDs (for diver search)
create policy "Operators can view all eco-dive IDs"
  on public.eco_dive_ids for select
  using (
    exists (
      select 1 from public.operator_applications
      where tourist_id = auth.uid() and status = 'approved'
    )
  );
