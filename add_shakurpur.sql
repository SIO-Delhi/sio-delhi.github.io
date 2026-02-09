-- =====================================================
-- FIX: ADD SHAKURPUR UNIT AND LINK MEMBERS
-- =====================================================

-- 1. Insert Shakurpur if it doesn't exist
INSERT IGNORE INTO portal_units (id, name, created_at) 
VALUES (UUID(), 'Shakurpur', NOW());

-- 1.5. Assign Shakurpur to West Region
UPDATE portal_units 
SET region_id = (SELECT id FROM portal_regions WHERE name = 'West Region' LIMIT 1)
WHERE name = 'Shakurpur';

-- 2. Get the ID of the new (or existing) Shakurpur unit
-- We use a variable to store it for the updates
SET @shakurpur_id = (SELECT id FROM portal_units WHERE name = 'Shakurpur' LIMIT 1);

-- 3. Link Members (Ateeq and Danish) to this unit
-- Ateeq (9151241734)
UPDATE portal_users 
SET 
    unit_id = @shakurpur_id,
    membership_type = 'unit',
    membership_id = @shakurpur_id
WHERE phone = '9151241734';

-- Danish (6387913305)
UPDATE portal_users 
SET 
    unit_id = @shakurpur_id,
    membership_type = 'unit',
    membership_id = @shakurpur_id
WHERE phone = '6387913305';

-- 4. Verify
SELECT * FROM portal_units WHERE name = 'Shakurpur';
SELECT first_name, phone, membership_type, unit_id
FROM portal_users 
WHERE phone IN ('9151241734', '6387913305');
