-- =====================================================
-- CLEANUP: Remove duplicates using existing columns
-- =====================================================
-- Run these in order

-- STEP 1: Check current state
SELECT 'UNITS' AS table_name, COUNT(*) AS count FROM portal_units
UNION ALL SELECT 'CIRCLES', COUNT(*) FROM portal_circles
UNION ALL SELECT 'CAMPUSES', COUNT(*) FROM portal_campuses;

-- STEP 2: Find duplicates between units and circles
SELECT 
    'UNIT-CIRCLE DUPLICATE' AS status,
    u.id AS unit_id, u.name AS unit_name, 
    c.id AS circle_id, c.name AS circle_name
FROM portal_units u
INNER JOIN portal_circles c ON LOWER(TRIM(u.name)) = LOWER(TRIM(c.name));

-- STEP 3: Find users on these duplicate units
SELECT pu.id, pu.first_name, pu.last_name, pu.unit_id, un.name AS unit_name
FROM portal_users pu
JOIN portal_units un ON pu.unit_id = un.id
WHERE LOWER(TRIM(un.name)) IN (SELECT LOWER(TRIM(name)) FROM portal_circles);

-- STEP 4: Reassign users from duplicate units to circles
-- (Clear their unit_id - they're circle members, not unit members)
UPDATE portal_users pu
JOIN portal_units un ON pu.unit_id = un.id
SET pu.unit_id = NULL
WHERE LOWER(TRIM(un.name)) IN (SELECT LOWER(TRIM(name)) FROM portal_circles);

-- STEP 5: Delete duplicate units (that exist in circles)
DELETE FROM portal_units 
WHERE LOWER(TRIM(name)) IN (SELECT LOWER(TRIM(name)) FROM portal_circles);

-- STEP 6: Delete duplicate units (that exist in campuses)
DELETE FROM portal_units 
WHERE LOWER(TRIM(name)) IN (SELECT LOWER(TRIM(name)) FROM portal_campuses);

-- STEP 7: Verify cleanup
SELECT 'UNITS after cleanup' AS table_name, COUNT(*) AS count FROM portal_units
UNION ALL SELECT 'CIRCLES', COUNT(*) FROM portal_circles
UNION ALL SELECT 'CAMPUSES', COUNT(*) FROM portal_campuses;

-- STEP 8: Check remaining units
SELECT id, name, region_id FROM portal_units ORDER BY name;
