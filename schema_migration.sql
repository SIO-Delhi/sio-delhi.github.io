-- =====================================================
-- SCHEMA MIGRATION: Unified Membership Model
-- =====================================================
-- Run these commands in order in phpMyAdmin

-- =====================================================
-- STEP 1: Add region_id to portal_circles
-- =====================================================
ALTER TABLE portal_circles 
ADD COLUMN region_id VARCHAR(36) NULL AFTER name;

ALTER TABLE portal_circles 
ADD CONSTRAINT fk_portal_circles_region 
FOREIGN KEY (region_id) REFERENCES portal_regions(id) ON DELETE SET NULL;

-- =====================================================
-- STEP 2: Add new membership columns to portal_users
-- =====================================================
ALTER TABLE portal_users 
ADD COLUMN membership_type ENUM('unit','circle','campus') NULL AFTER region_id;

ALTER TABLE portal_users 
ADD COLUMN membership_id VARCHAR(36) NULL AFTER membership_type;

-- =====================================================
-- STEP 3: Migrate existing data to new columns
-- Priority: unit_id > circle_id > campus_id
-- =====================================================

-- Users with unit_id set -> membership_type='unit'
UPDATE portal_users 
SET membership_type = 'unit', membership_id = unit_id 
WHERE unit_id IS NOT NULL;

-- Users with only circle_id set (no unit_id) -> membership_type='circle'
UPDATE portal_users 
SET membership_type = 'circle', membership_id = circle_id 
WHERE unit_id IS NULL AND circle_id IS NOT NULL;

-- Users with only campus_id set (no unit_id or circle_id) -> membership_type='campus'
UPDATE portal_users 
SET membership_type = 'campus', membership_id = campus_id 
WHERE unit_id IS NULL AND circle_id IS NULL AND campus_id IS NOT NULL;

-- =====================================================
-- STEP 4: Verify migration
-- =====================================================
SELECT 
    membership_type,
    COUNT(*) as count
FROM portal_users
GROUP BY membership_type;

-- Check for any users without membership
SELECT id, first_name, last_name, role, unit_id, circle_id, campus_id, membership_type, membership_id
FROM portal_users
WHERE membership_type IS NULL OR membership_id IS NULL;

-- =====================================================
-- STEP 5: Assign region_ids to circles (based on your region mapping)
-- =====================================================

-- NORTH-CENTRAL REGION circles
UPDATE portal_circles 
SET region_id = (SELECT id FROM portal_regions WHERE name = 'North-Central Region')
WHERE LOWER(TRIM(name)) IN (
    'usmanpur', 'ballimaran', 'bara hindu rao', 'inderlok', 
    'karol bagh', 'laxmi nagar', 'vijayanagar', 'nabi karim'
);

-- SOUTH REGION circles
UPDATE portal_circles 
SET region_id = (SELECT id FROM portal_regions WHERE name = 'South Region')
WHERE LOWER(TRIM(name)) IN (
    'mahipalpur', 'saket', 'chhajarsi', 'jaitpur', 'jasola'
);

-- NORTH-EAST REGION circles
UPDATE portal_circles 
SET region_id = (SELECT id FROM portal_regions WHERE name = 'North-East Region')
WHERE LOWER(TRIM(name)) IN (
    '3rd pushta', 'indrapuri', 'shahdara', 'pasonda', 'loni', 'mustafabad'
);

-- WEST REGION circles
UPDATE portal_circles 
SET region_id = (SELECT id FROM portal_regions WHERE name = 'West Region')
WHERE LOWER(TRIM(name)) IN (
    'nihal vihar', 'paschim vihar'
);

-- =====================================================
-- STEP 6: Remove duplicates from portal_units
-- (entries that exist in portal_circles or portal_campuses)
-- =====================================================

-- First, update any users pointing to these duplicate units
UPDATE portal_users u
JOIN portal_units pu ON u.membership_id = pu.id
SET u.membership_type = 'circle',
    u.membership_id = (SELECT c.id FROM portal_circles c WHERE LOWER(TRIM(c.name)) = LOWER(TRIM(pu.name)) LIMIT 1)
WHERE u.membership_type = 'unit'
  AND LOWER(TRIM(pu.name)) IN (SELECT LOWER(TRIM(name)) FROM portal_circles);

-- Then delete the duplicates
DELETE FROM portal_units 
WHERE LOWER(TRIM(name)) IN (SELECT LOWER(TRIM(name)) FROM portal_circles);

DELETE FROM portal_units 
WHERE LOWER(TRIM(name)) IN (SELECT LOWER(TRIM(name)) FROM portal_campuses);

-- =====================================================
-- STEP 7: Verify final state
-- =====================================================
SELECT 'UNITS' AS table_name, COUNT(*) AS count FROM portal_units
UNION ALL SELECT 'CIRCLES', COUNT(*) FROM portal_circles
UNION ALL SELECT 'CAMPUSES', COUNT(*) FROM portal_campuses;

SELECT membership_type, COUNT(*) as count FROM portal_users GROUP BY membership_type;

-- =====================================================
-- STEP 8: (OPTIONAL) Drop old columns after verification
-- Only run this after confirming everything works!
-- =====================================================
-- ALTER TABLE portal_users DROP FOREIGN KEY fk_portal_users_unit;
-- ALTER TABLE portal_users DROP FOREIGN KEY fk_portal_users_circle;
-- ALTER TABLE portal_users DROP FOREIGN KEY fk_portal_users_campus;
-- ALTER TABLE portal_users DROP COLUMN unit_id;
-- ALTER TABLE portal_users DROP COLUMN circle_id;
-- ALTER TABLE portal_users DROP COLUMN campus_id;
