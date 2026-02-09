-- =====================================================
-- FIX ALL SCHEMA SCRIPT
-- =====================================================
-- Run this ENTIRE script in phpMyAdmin to fix the 500 error and missing fields.

-- 1. Ensure Regions Exist
INSERT IGNORE INTO portal_regions (id, name, created_at) VALUES 
(UUID(), 'AFE Area', NOW()),
(UUID(), 'South Region', NOW()),
(UUID(), 'North-East Region', NOW()),
(UUID(), 'West Region', NOW()),
(UUID(), 'North-Central Region', NOW());

-- 2. Add New Membership Columns (if they don't exist)
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'portal_users' AND column_name = 'membership_type');
SET @sql := IF(@exist = 0, 'ALTER TABLE portal_users ADD COLUMN membership_type ENUM(\'unit\',\'circle\',\'campus\') NULL AFTER region_id', 'SELECT "Column membership_type already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'portal_users' AND column_name = 'membership_id');
SET @sql := IF(@exist = 0, 'ALTER TABLE portal_users ADD COLUMN membership_id VARCHAR(36) NULL AFTER membership_type', 'SELECT "Column membership_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Add region_id to portal_circles (if missing)
SET @exist := (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'portal_circles' AND column_name = 'region_id');
SET @sql := IF(@exist = 0, 'ALTER TABLE portal_circles ADD COLUMN region_id VARCHAR(36) NULL AFTER name', 'SELECT "Column region_id already exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4. Make Last Name Optional
ALTER TABLE portal_users MODIFY COLUMN last_name VARCHAR(128) NULL;

-- 5. Migrate Data (Unit/Circle/Campus ID -> Membership Type)
UPDATE portal_users SET membership_type = 'unit', membership_id = unit_id WHERE unit_id IS NOT NULL;
UPDATE portal_users SET membership_type = 'circle', membership_id = circle_id WHERE unit_id IS NULL AND circle_id IS NOT NULL;
UPDATE portal_users SET membership_type = 'campus', membership_id = campus_id WHERE unit_id IS NULL AND circle_id IS NULL AND campus_id IS NOT NULL;

-- 6. Add/Fix Shakurpur Unit
INSERT IGNORE INTO portal_units (id, name, created_at) VALUES (UUID(), 'Shakurpur', NOW());

-- Assign Shakurpur to West Region
UPDATE portal_units 
SET region_id = (SELECT id FROM portal_regions WHERE name = 'West Region' LIMIT 1)
WHERE name = 'Shakurpur';

-- 7. Link specific members (Ateeq & Danish) to Shakurpur
SET @shakurpur_id = (SELECT id FROM portal_units WHERE name = 'Shakurpur' LIMIT 1);

UPDATE portal_users 
SET unit_id = @shakurpur_id, membership_type = 'unit', membership_id = @shakurpur_id
WHERE phone IN ('9151241734', '6387913305');

-- 8. Assign Regions to Circles (Critical for 'View Member' to work if Circle is selected)
-- North-Central 
UPDATE portal_circles SET region_id = (SELECT id FROM portal_regions WHERE name = 'North-Central Region' LIMIT 1)
WHERE name IN ('Ballimaran','Bara Hindu Rao','Inderlok','Karol Bagh','Laxmi Nagar','Vijay Nagar','Vijaynagar','Nabi Karim');

-- South
UPDATE portal_circles SET region_id = (SELECT id FROM portal_regions WHERE name = 'South Region' LIMIT 1)
WHERE name IN ('Mahipalpur','Saket','Chhajarsi');

-- North-East
UPDATE portal_circles SET region_id = (SELECT id FROM portal_regions WHERE name = 'North-East Region' LIMIT 1)
WHERE name IN ('Usmanpur','3rd Pushta','Indrapuri','Pasonda','Shahdara','Mustafabad');

-- West
UPDATE portal_circles SET region_id = (SELECT id FROM portal_regions WHERE name = 'West Region' LIMIT 1)
WHERE name IN ('Nihal Vihar', 'Paschim Vihar');

SELECT "ALL FIXES APPLIED SUCCESSFULLY" AS status;
