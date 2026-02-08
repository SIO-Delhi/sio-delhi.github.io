-- Campuses and Circles from Organisation Setup 2026.pdf
-- Run after portal_units, portal_users, portal_campuses, portal_circles exist.
-- This populates Manage Campuses and Manage Circles so they are not empty.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. CAMPUSES (PDF: CAMPUS UNITS 22–26 = Academy, Jamia JMI, D.U, JNU, Jamia Hamdard)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO portal_campuses (id, name) VALUES
  ('c1000001-0000-4000-8000-000000000001', 'Academy'),
  ('c1000002-0000-4000-8000-000000000002', 'Jamia Millia Islamia'),
  ('c1000003-0000-4000-8000-000000000003', 'D.U'),
  ('c1000004-0000-4000-8000-000000000004', 'JNU'),
  ('c1000005-0000-4000-8000-000000000005', 'Jamia Hamdard')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- 2. Assign users in campus units to the corresponding campus (so campus pages show members)
UPDATE portal_users u
JOIN portal_units un ON u.unit_id = un.id
SET u.campus_id = 'c1000001-0000-4000-8000-000000000001'
WHERE un.name = 'IIISR';

UPDATE portal_users u
JOIN portal_units un ON u.unit_id = un.id
SET u.campus_id = 'c1000002-0000-4000-8000-000000000002'
WHERE un.name = 'Jamia Millia Islamia';

UPDATE portal_users u
JOIN portal_units un ON u.unit_id = un.id
SET u.campus_id = 'c1000003-0000-4000-8000-000000000003'
WHERE un.name = 'D.U';

UPDATE portal_users u
JOIN portal_units un ON u.unit_id = un.id
SET u.campus_id = 'c1000004-0000-4000-8000-000000000004'
WHERE un.name = 'JNU';

UPDATE portal_users u
JOIN portal_units un ON u.unit_id = un.id
SET u.campus_id = 'c1000005-0000-4000-8000-000000000005'
WHERE un.name IN ('Jamia Hamdard', 'Jamia hamdard');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. CIRCLES (PDF: CIRCLE ORGANISERS list — 16 circles)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT IGNORE INTO portal_circles (id, name) VALUES
  (UUID(), 'Nihal Vihar'), (UUID(), 'Usmanpur'), (UUID(), '3rd Pushta'), (UUID(), 'Paschim Vihar'),
  (UUID(), 'Chhajarsi'), (UUID(), 'Ballimaran'), (UUID(), 'Bara Hindu Rao'), (UUID(), 'Inderlok'),
  (UUID(), 'Indrapuri'), (UUID(), 'Karol Bagh'), (UUID(), 'Laxmi Nagar'), (UUID(), 'Mahipalpur'),
  (UUID(), 'Pasonda'), (UUID(), 'Saket'), (UUID(), 'Shahdara'), (UUID(), 'Vijaynagar');

-- After this, run organisation_setup_2026_updates.sql to set circle region_id if portal_circles have region_id column.
