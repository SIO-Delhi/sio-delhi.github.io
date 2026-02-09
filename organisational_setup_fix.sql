-- =====================================================
-- ORGANISATIONAL SETUP FIX (Based on PDF)
-- =====================================================

-- 1. Ensure Regions Exist (including new 'AFE Area')
INSERT IGNORE INTO portal_regions (id, name, created_at) VALUES 
(UUID(), 'AFE Area', NOW()),
(UUID(), 'South Region', NOW()),
(UUID(), 'North-East Region', NOW()),
(UUID(), 'West Region', NOW()),
(UUID(), 'North-Central Region', NOW());

-- =====================================================
-- 2. MOVE MISCLASSIFIED UNITS -> CIRCLES
-- (Entities that were created as Units but are actually Circles)
-- =====================================================

-- Procedure for each misclassified entity:
-- a) Create Circle if not exists
-- b) Move Members from Unit -> Circle
-- c) Delete Unit

-- List: Nihal Vihar, Usmanpur, Chhajarsi, Ballimaran, Bara Hindu Rao, Inderlok, 
-- Indrapuri, Karol Bagh, Laxmi Nagar, Mahipalpur, Pasonda, Saket, Shahdara, Vijay Nagar

DROP PROCEDURE IF EXISTS MoveUnitToCircle;
DELIMITER //
CREATE PROCEDURE MoveUnitToCircle(IN unitName VARCHAR(255), IN targetCircleName VARCHAR(255))
BEGIN
    DECLARE u_id VARCHAR(36);
    DECLARE c_id VARCHAR(36);
    
    -- Get Unit ID
    SELECT id INTO u_id FROM portal_units WHERE name = unitName LIMIT 1;
    
    -- If Unit exists, we proceed
    IF u_id IS NOT NULL THEN
        -- Check if Target Circle exists, if not create it
        SELECT id INTO c_id FROM portal_circles WHERE name = targetCircleName LIMIT 1;
        
        IF c_id IS NULL THEN
            SET c_id = UUID();
            INSERT INTO portal_circles (id, name, created_at) VALUES (c_id, targetCircleName, NOW());
        END IF;
        
        -- Move Members
        UPDATE portal_users SET membership_type = 'circle', membership_id = c_id 
        WHERE membership_type = 'unit' AND membership_id = u_id;
        
        -- Delete Unit
        DELETE FROM portal_units WHERE id = u_id;
    END IF;
END //
DELIMITER ;

CALL MoveUnitToCircle('Nihal Vihar', 'Nihal Vihar');
CALL MoveUnitToCircle('Usmanpur', 'Usmanpur');
CALL MoveUnitToCircle('Chhajarsi', 'Chhajarsi');
CALL MoveUnitToCircle('Ballimaran', 'Ballimaran');
CALL MoveUnitToCircle('Bara Hindu Rao', 'Bara Hindu Rao');
CALL MoveUnitToCircle('Inderlok', 'Inderlok');
CALL MoveUnitToCircle('Indrapuri', 'Indrapuri');
CALL MoveUnitToCircle('Karol Bagh', 'Karol Bagh');
CALL MoveUnitToCircle('Laxmi Nagar', 'Laxmi Nagar');
CALL MoveUnitToCircle('Mahipalpur', 'Mahipalpur');
CALL MoveUnitToCircle('Pasonda', 'Pasonda');
CALL MoveUnitToCircle('Saket', 'Saket');
CALL MoveUnitToCircle('Shahdara', 'Shahdara');
-- Merge both spellings into 'Vijay Nagar'
CALL MoveUnitToCircle('Vijay Nagar', 'Vijay Nagar');
CALL MoveUnitToCircle('Vijaynagar', 'Vijay Nagar'); 

CALL MoveUnitToCircle('3rd Pushta', '3rd Pushta');
CALL MoveUnitToCircle('Paschim Vihar', 'Paschim Vihar');

DROP PROCEDURE MoveUnitToCircle;

-- =====================================================
-- 3. ASSIGN REGIONS TO UNITS
-- =====================================================

-- SOUTH REGION UNITS
UPDATE portal_units SET region_id = (SELECT id FROM portal_regions WHERE name = 'South Region' LIMIT 1)
WHERE name IN ('Shaheen Bagh', 'Jaitpur', 'Kanchan Kunj', 'Batla House', 'Okhla Village', 'Greater Noida', 'Jasola', 'Okhla Unit', 'Jamia Unit'); 
-- (Added Okhla/Jamia Unit just in case they are legacy names for Batla House/Jamia)

-- NORTH-EAST REGION UNITS
UPDATE portal_units SET region_id = (SELECT id FROM portal_regions WHERE name = 'North-East Region' LIMIT 1)
WHERE name IN ('Ghonda', 'Kardampuri', 'Old Mustafabad', 'New Mustafabad', 'Seemapuri', 'Loni');

-- WEST REGION UNITS
UPDATE portal_units SET region_id = (SELECT id FROM portal_regions WHERE name = 'West Region' LIMIT 1)
WHERE name IN ('Vikas Nagar', 'Shakurpur', 'Raghubir Nagar', 'Shakurpur'); 

-- NORTH-CENTRAL REGION UNITS
UPDATE portal_units SET region_id = (SELECT id FROM portal_regions WHERE name = 'North-Central Region' LIMIT 1)
WHERE name IN ('Jahangir Puri', 'Jahangirpuri', 'Nabi Karim', 'Chandni Chowk Unit', 'Rohini Unit');

-- AFE AREA UNITS
UPDATE portal_units SET region_id = (SELECT id FROM portal_regions WHERE name = 'AFE Area' LIMIT 1)
WHERE name IN ('Abul Fazl Enclave North', 'Abul Fazl Enclave South', 'AFE North', 'AFE South', 'JIH-HQ');

-- =====================================================
-- 4. ASSIGN REGIONS TO CIRCLES
-- =====================================================

-- SOUTH REGION CIRCLES
UPDATE portal_circles SET region_id = (SELECT id FROM portal_regions WHERE name = 'South Region' LIMIT 1)
WHERE name IN ('Mahipalpur', 'Saket', 'Chhajarsi');

-- NORTH-EAST REGION CIRCLES
UPDATE portal_circles SET region_id = (SELECT id FROM portal_regions WHERE name = 'North-East Region' LIMIT 1)
WHERE name IN ('Usmanpur', '3rd Pushta', 'Indrapuri', 'Pasonda', 'Shahdara', 'Mustafabad');

-- WEST REGION CIRCLES
UPDATE portal_circles SET region_id = (SELECT id FROM portal_regions WHERE name = 'West Region' LIMIT 1)
WHERE name IN ('Nihal Vihar', 'Paschim Vihar');

-- NORTH-CENTRAL REGION CIRCLES
UPDATE portal_circles SET region_id = (SELECT id FROM portal_regions WHERE name = 'North-Central Region' LIMIT 1)
WHERE name IN ('Ballimaran', 'Bara Hindu Rao', 'Inderlok', 'Karol Bagh', 'Laxmi Nagar', 'Vijay Nagar', 'Vijaynagar', 'Nabi Karim'); 
-- Note: Nabi Karim is listed as UNIT in PDF Section 4, but maybe check Circle too just in case. 
-- PDF clearly puts Nabi Karim in UNITS section. Removing from Circles update to be safe, or leave if it was auto-moved? 
-- It was NOT in the MoveUnitToCircle list, so it stays as Unit.

-- =====================================================
-- 5. MERGE DUPLICATE CIRCLES (Vijaynagar -> Vijay Nagar)
-- =====================================================
DROP PROCEDURE IF EXISTS MergeCircles;
DELIMITER //
CREATE PROCEDURE MergeCircles(IN wrongName VARCHAR(255), IN rightName VARCHAR(255))
BEGIN
    DECLARE w_id VARCHAR(36);
    DECLARE r_id VARCHAR(36);
    
    SELECT id INTO w_id FROM portal_circles WHERE name = wrongName LIMIT 1;
    SELECT id INTO r_id FROM portal_circles WHERE name = rightName LIMIT 1;
    
    IF w_id IS NOT NULL AND r_id IS NOT NULL THEN
        -- Move members
        UPDATE portal_users SET membership_id = r_id 
        WHERE membership_type = 'circle' AND membership_id = w_id;
        
        -- Delete wrong circle
        DELETE FROM portal_circles WHERE id = w_id;
    END IF;
END //
DELIMITER ;

CALL MergeCircles('Vijaynagar', 'Vijay Nagar');
DROP PROCEDURE MergeCircles;

-- Done!
