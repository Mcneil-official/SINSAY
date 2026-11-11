-- Remove the two legacy resort listings requested for removal.
-- Existing operator applications reference establishments with ON DELETE SET NULL.
delete from public.establishments
where lower(trim(name)) in (
  'anilao divers resort',
  'crystal blue resort'
);
