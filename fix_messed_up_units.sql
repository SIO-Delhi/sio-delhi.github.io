-- =====================================================
-- FIX FOR MESSY UNITS (Case Sensitive Duplicates)
-- =====================================================

-- 1. Fix 'Jamia hamdard' (Unit) -> 'Jamia Hamdard' (Campus)
-- Move members:
UPDATE portal_users 
SET membership_type = 'campus', 
    membership_id = (SELECT id FROM portal_campuses WHERE name = 'Jamia Hamdard' LIMIT 1) 
WHERE membership_type = 'unit' 
  AND membership_id = (SELECT id FROM portal_units WHERE name = 'Jamia hamdard' LIMIT 1);

-- Delete the bad unit:
DELETE FROM portal_units WHERE name = 'Jamia hamdard';


-- 2. Fix 'shakurpur' (lowercase) -> 'Shakurpur' (Title Case)
-- Ensure Title Case unit exists:
INSERT IGNORE INTO portal_units (id, name, created_at) 
VALUES (UUID(), 'Shakurpur', NOW());

-- Move members:
UPDATE portal_users 
SET membership_id = (SELECT id FROM portal_units WHERE name = 'Shakurpur' LIMIT 1) 
WHERE membership_type = 'unit' 
  AND membership_id = (SELECT id FROM portal_units WHERE name = 'shakurpur' LIMIT 1);

-- Delete the bad unit:
DELETE FROM portal_units WHERE name = 'shakurpur';

-- 3. Cleanup any other potential orphans (Optional but safe)
-- (No other obvious ones seen in screenshot)
