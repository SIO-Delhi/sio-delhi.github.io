-- Organisation Setup 2026: regions, unit→region, regional presidents, unit presidents, circle→region.
-- Source: Organisation Setup 2026.pdf
-- Run after: portal_regions, portal_units, portal_users exist; portal_units.region_id and portal_users.region_id exist.
-- For circles: run portal-circles-add-region.sql first so portal_circles.region_id exists.
-- Campuses are not assigned to regions.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. REGIONS (insert with fixed IDs so updates are repeatable)
-- ═══════════════════════════════════════════════════════════════════════════════
INSERT INTO portal_regions (id, name) VALUES
  ('a0000001-0000-4000-8000-000000000001', 'AFE Area'),
  ('a0000002-0000-4000-8000-000000000002', 'South Region'),
  ('a0000003-0000-4000-8000-000000000003', 'North-Central Region'),
  ('a0000004-0000-4000-8000-000000000004', 'North-East Region'),
  ('a0000005-0000-4000-8000-000000000005', 'West Region')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. UNITS → REGION (only area/region units; campus units stay NULL)
-- PDF: AFE Area, South Delhi, North-East, West, North-Central. Campus units: no region.
-- ═══════════════════════════════════════════════════════════════════════════════

-- AFE Area
UPDATE portal_units SET region_id = 'a0000001-0000-4000-8000-000000000001' WHERE name IN ('Abul Fazl Enclave North', 'Abul Fazl Enclave South');

-- South Region
UPDATE portal_units SET region_id = 'a0000002-0000-4000-8000-000000000002' WHERE name IN ('Shaheen Bagh', 'Jaitpur', 'Kanchankunj', 'Batla House', 'Okhla Village', 'Greater Noida', 'Jasola');

-- North-East Region
UPDATE portal_units SET region_id = 'a0000004-0000-4000-8000-000000000004' WHERE name IN ('Ghonda', 'Kardampuri', 'Old Mustafabad', 'New Mustafabad', 'Seemapuri', 'Loni');

-- West Region
UPDATE portal_units SET region_id = 'a0000005-0000-4000-8000-000000000005' WHERE name IN ('Vikas Nagar', 'shakurpur', 'Raghubir Nagar');

-- North-Central Region
UPDATE portal_units SET region_id = 'a0000003-0000-4000-8000-000000000003' WHERE name IN ('Jahangir Puri', 'Nabi Karim');

-- Campus units: leave region_id NULL (D.U, JNU, Jamia Hamdard, Jamia Millia Islamia, IIISR/Academy, etc.)
-- Explicitly clear if they were ever set:
UPDATE portal_units SET region_id = NULL WHERE name IN ('D.U', 'JNU', 'Jamia Hamdard', 'Jamia hamdard', 'Jamia Millia Islamia', 'IIISR');

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. REGIONAL PRESIDENTS (set region_id and role by phone from PDF)
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE portal_users SET role = 'regional_president', region_id = 'a0000001-0000-4000-8000-000000000001' WHERE phone = '9096309493';  -- Shaikh Luqman, AFE Area
UPDATE portal_users SET role = 'regional_president', region_id = 'a0000002-0000-4000-8000-000000000002' WHERE phone = '9990536320';  -- Ata Ur Rahman, South
UPDATE portal_users SET role = 'regional_president', region_id = 'a0000003-0000-4000-8000-000000000003' WHERE phone = '7503724724';  -- Md Hamza, North-Central
UPDATE portal_users SET role = 'regional_president', region_id = 'a0000004-0000-4000-8000-000000000004' WHERE phone = '8595177695';  -- Rikaz Ahmad, North-East
UPDATE portal_users SET role = 'regional_president', region_id = 'a0000005-0000-4000-8000-000000000005' WHERE phone = '8851222824';  -- Sarfaraz Khan, West

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. UNIT PRESIDENTS (set role and unit_id by phone from PDF)
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Abul Fazl Enclave North' LIMIT 1) WHERE phone = '7083591559';   -- Sheikh Rahil
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Abul Fazl Enclave South' LIMIT 1) WHERE phone = '9560417190';   -- Saqib Khan
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Shaheen Bagh' LIMIT 1) WHERE phone = '9718859695';             -- Abidullah Mohsin
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Jaitpur' LIMIT 1) WHERE phone = '8009277652';               -- Mohd Danish
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Kanchankunj' LIMIT 1) WHERE phone = '7303539252';            -- Kashif Zafar
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Batla House' LIMIT 1) WHERE phone = '8887519095';            -- Rakey Kirmani
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Ghonda' LIMIT 1) WHERE phone = '8929092747';                 -- Md Zulkifl
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Kardampuri' LIMIT 1) WHERE phone = '9971679234';             -- Mohd Azimushshan Alam
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Old Mustafabad' LIMIT 1) WHERE phone = '9899868113';          -- Mohammad Shuaib
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'New Mustafabad' LIMIT 1) WHERE phone = '9821457985';          -- Shuaib
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Seemapuri' LIMIT 1) WHERE phone = '7840865278';              -- Moin Khan
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Loni' LIMIT 1) WHERE phone = '7982059719';                  -- Zubair Mirza
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Vikas Nagar' LIMIT 1) WHERE phone = '7834994709';           -- Uvais Saifi
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'shakurpur' LIMIT 1) WHERE phone = '7019665934';             -- Abdullah Ansari
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Jahangir Puri' LIMIT 1) WHERE phone = '8587802938';          -- Noor Aalam
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Nabi Karim' LIMIT 1) WHERE phone = '9810541031';             -- Mohd Kamran
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'IIISR' LIMIT 1) WHERE phone = '7999921223';                    -- Sajid Ali (Academy)

-- Jamia JMI president: Br. Zeeshan Akhtar 7491885657 (if this phone exists in DB it will be updated)
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Jamia Millia Islamia' LIMIT 1) WHERE phone = '7491885657';

-- Additional unit presidents from PDF (South / West sections)
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Greater Noida' LIMIT 1) WHERE phone = '8707397876';   -- Safeer Alam (PDF South region)
UPDATE portal_users SET role = 'unit_president', unit_id = (SELECT id FROM portal_units WHERE name = 'Raghubir Nagar' LIMIT 1) WHERE phone = '9310762458';   -- Aftab Husain (PDF West region)

-- Units that may have presidents in PDF but were not in extracted text (assign manually if needed): Okhla Village, Jasola, JIH-HQ, D.U, JNU, Jamia Hamdard.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4a. PRESIDENT TITLES (so Unit Presidents section shows "Unit President", not "Unit Secretary")
-- Run after role updates above. Regional presidents and unit presidents get their title; campus units use same role=unit_president so they get "Unit President" too.
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE portal_users SET title = 'Regional President' WHERE role = 'regional_president';
UPDATE portal_users SET title = 'Unit President' WHERE role = 'unit_president';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4b. UNIT SECRETARIES (set title = 'Unit Secretary' only for members who are NOT presidents)
-- Exclude unit_president and regional_president so we do not overwrite their title.
-- ═══════════════════════════════════════════════════════════════════════════════
UPDATE portal_users SET title = 'Unit Secretary' WHERE phone IN (
  '7870469990',  '9971074742',  '9891226461',  '9310487906',  '7827862820',  '6375257651',
  '7654289165',  '9319802172',  '8700441692',  '9811559012',  '9582394055',  '8882316765',
  '7678335628',  '9654580742',  '8700817951',  '9079509104',  '7510263736'
) AND role NOT IN ('unit_president', 'regional_president', 'admin', 'zonal_secretary');
-- Note: 8707397876 (Safeer), 7019665934 (Abdullah Ansari), 9310762458 (Aftab) are unit presidents so excluded from this list.

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. CIRCLES → REGION (only where PDF lists a region; else leave NULL = under zone)
-- PDF circle list with region. Match circle name; if circle not in DB, no row updated.
-- ═══════════════════════════════════════════════════════════════════════════════

-- West
UPDATE portal_circles SET region_id = 'a0000005-0000-4000-8000-000000000005' WHERE LOWER(TRIM(name)) IN ('nihal vihar', 'paschim vihar');

-- North-East
UPDATE portal_circles SET region_id = 'a0000004-0000-4000-8000-000000000004' WHERE LOWER(TRIM(name)) IN ('usmanpur', '3rd pushta', 'indrapuri', 'pasonda', 'shahdara');

-- South
UPDATE portal_circles SET region_id = 'a0000002-0000-4000-8000-000000000002' WHERE LOWER(TRIM(name)) IN ('chhajarsi', 'mahipalpur', 'saket');

-- North-Central
UPDATE portal_circles SET region_id = 'a0000003-0000-4000-8000-000000000003' WHERE LOWER(TRIM(name)) IN ('ballimaran', 'bara hindu rao', 'inderlok', 'karol bagh', 'laxmi nagar', 'vijaynagar');

-- Circles not mentioned in PDF or whose region is not one of the five: leave region_id NULL (under zone directly).
-- Optional: explicitly set to NULL for any circle that might have had an old region:
-- UPDATE portal_circles SET region_id = NULL WHERE name NOT IN (...);
