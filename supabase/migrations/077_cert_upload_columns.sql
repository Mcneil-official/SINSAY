-- Migration 077: Add certification upload path columns to tourists
-- Replaces PCSSD/permit fields in the Dive Instructor/Master form with:
--   cert_upload_path  - path to Certification Proof file in tourist_uploads bucket
--   renewal_cert_path - path to Renewal Proof file in tourist_uploads bucket
-- date_accredited and renewal_date already exist from 001_initial_schema.sql

ALTER TABLE tourists
  ADD COLUMN IF NOT EXISTS cert_upload_path  text,
  ADD COLUMN IF NOT EXISTS renewal_cert_path text;

COMMENT ON COLUMN tourists.cert_upload_path  IS 'Storage path of certification proof file (tourist_uploads bucket)';
COMMENT ON COLUMN tourists.renewal_cert_path IS 'Storage path of renewal proof file (tourist_uploads bucket)';
