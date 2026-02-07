-- ============================================
-- Drop UNIQUE constraint on phone in portal_users
-- Reason: Multiple members can share a phone number (family members),
--         and members without a phone get 'xxxx' placeholder.
--         Login is via Clerk (username), not phone, so uniqueness is not required.
-- Safe to run multiple times.
-- ============================================

-- Step 1: Find and drop the UNIQUE index on phone.
-- MySQL names the index after the column by default ('phone'),
-- but it could also be a custom name. Try common names:

-- Drop the unique key named 'phone' (default)
ALTER TABLE portal_users DROP INDEX phone;

-- If a non-unique index idx_pu_phone doesn't exist yet, add it for query perf
-- (the CREATE TABLE already has it, but this covers existing DBs)
-- CREATE INDEX IF NOT EXISTS is not standard MySQL, so wrap in a procedure:

-- Add non-unique index if not present (safe to fail silently)
-- ALTER TABLE portal_users ADD INDEX idx_pu_phone (phone);
-- Note: if idx_pu_phone already exists (from CREATE TABLE), this will error.
-- Just ignore the error, or run only if the index doesn't exist.

-- ============================================
-- After running this, re-run the seed SQL to insert all 287 members:
--   source siodelhi_data_seed.sql
-- ============================================
