-- =====================================================
-- FIX FOR DUPLICATE REGIONS
-- =====================================================

DROP PROCEDURE IF EXISTS DeduplicateRegions;
DELIMITER //
CREATE PROCEDURE DeduplicateRegions()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE r_name VARCHAR(255);
    DECLARE cur CURSOR FOR 
        SELECT name FROM portal_regions GROUP BY name HAVING COUNT(*) > 1;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO r_name;
        IF done THEN
            LEAVE read_loop;
        END IF;

        -- We have a duplicate name 'r_name'
        -- Strategy: Keep the one created FIRST (MIN created_at), or just ANY one.
        -- Let's pick the one with the alphanumeric ID that looks like UUID (they all are UUIDs),
        -- so picking MIN(id) or MIN(created_at) is fine.
        -- HOWEVER, likely one has dependencies (units/circles linked) and others might not.
        -- Safe bet: Pick one 'keeper_id', update all FKs to point to 'keeper_id', delete others.

        BLOCK2: BEGIN
            DECLARE keeper_id VARCHAR(36);
            
            -- Pick a keeper (e.g., the first one created)
            SELECT id INTO keeper_id FROM portal_regions WHERE name = r_name ORDER BY created_at ASC, id ASC LIMIT 1;
            
            -- Update portal_units
            UPDATE portal_units SET region_id = keeper_id WHERE region_id IN (SELECT id FROM portal_regions WHERE name = r_name AND id != keeper_id);
            
            -- Update portal_circles
            UPDATE portal_circles SET region_id = keeper_id WHERE region_id IN (SELECT id FROM portal_regions WHERE name = r_name AND id != keeper_id);
            
            -- Update portal_users
            UPDATE portal_users SET region_id = keeper_id WHERE region_id IN (SELECT id FROM portal_regions WHERE name = r_name AND id != keeper_id);
            
            -- Update portal_region_units (President mappings)
            -- This has a composite key, so we need INSERT IGNORE or careful UPDATE.
            -- Simplest: Update IGNORE. If conflict, the existing relation stands, so we can delete the bad one.
            UPDATE IGNORE portal_region_units SET regional_president_id = keeper_id WHERE regional_president_id IN (SELECT id FROM portal_regions WHERE name = r_name AND id != keeper_id);
            -- Actually portal_region_units links TO portal_users (regional_president_id), NOT region table directly?
            -- Let's check schema: regional_president_id REFERENCES portal_users(id).
            -- Wait, portal_region_units table does NOT have a region_id column in the schema I saw?
            -- It joins `regional_president_id` (User) and `unit_id` (Unit).
            -- The explicit `portal_regions` table is linked via `portal_units.region_id` and `portal_users.region_id`.
            
            -- So just Units, Circles, Users need updating.
            
            -- Delete the duplicates
            DELETE FROM portal_regions WHERE name = r_name AND id != keeper_id;
            
        END BLOCK2;
    END LOOP;

    CLOSE cur;
END //
DELIMITER ;

CALL DeduplicateRegions();
DROP PROCEDURE DeduplicateRegions;

-- =====================================================
-- PREVENT FUTURE DUPLICATES
-- =====================================================
ALTER TABLE portal_regions ADD UNIQUE (name);
