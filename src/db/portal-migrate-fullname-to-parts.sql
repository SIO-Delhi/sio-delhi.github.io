-- ============================================
-- Migrate portal_users: full_name -> first/middle/last, and add username, etc.
-- Safe to run multiple times: only adds columns that are missing.
--
-- If your table has neither full_name nor first_name: recreate from portal-schema.sql.
-- ============================================

-- Ensure portal_circles exists
CREATE TABLE IF NOT EXISTS portal_circles (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add columns only if they don't exist (avoids "Duplicate column name" errors)
DROP PROCEDURE IF EXISTS add_portal_user_columns;
DELIMITER ;;
CREATE PROCEDURE add_portal_user_columns()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'portal_users' AND COLUMN_NAME = 'first_name') THEN
    ALTER TABLE portal_users ADD COLUMN first_name VARCHAR(128) AFTER id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'portal_users' AND COLUMN_NAME = 'middle_name') THEN
    ALTER TABLE portal_users ADD COLUMN middle_name VARCHAR(128) AFTER first_name;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'portal_users' AND COLUMN_NAME = 'last_name') THEN
    ALTER TABLE portal_users ADD COLUMN last_name VARCHAR(128) AFTER middle_name;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'portal_users' AND COLUMN_NAME = 'username') THEN
    ALTER TABLE portal_users ADD COLUMN username VARCHAR(64) UNIQUE AFTER last_name;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'portal_users' AND COLUMN_NAME = 'date_of_birth') THEN
    ALTER TABLE portal_users ADD COLUMN date_of_birth VARCHAR(8) AFTER password;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'portal_users' AND COLUMN_NAME = 'circle_id') THEN
    ALTER TABLE portal_users ADD COLUMN circle_id VARCHAR(36) AFTER unit_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'portal_users' AND COLUMN_NAME = 'permission_overrides') THEN
    ALTER TABLE portal_users ADD COLUMN permission_overrides JSON AFTER circle_id;
  END IF;
END;;
DELIMITER ;
CALL add_portal_user_columns();
DROP PROCEDURE IF EXISTS add_portal_user_columns;

-- Backfill first/middle/last from full_name (only if full_name column still exists)
DROP PROCEDURE IF EXISTS backfill_from_full_name;
DELIMITER ;;
CREATE PROCEDURE backfill_from_full_name()
BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'portal_users' AND COLUMN_NAME = 'full_name') THEN
    UPDATE portal_users
    SET
      first_name = SUBSTRING_INDEX(TRIM(COALESCE(full_name, 'Unknown')), ' ', 1),
      last_name  = SUBSTRING_INDEX(TRIM(COALESCE(full_name, 'Unknown')), ' ', -1),
      middle_name = CASE
        WHEN CHAR_LENGTH(TRIM(COALESCE(full_name, ''))) - CHAR_LENGTH(REPLACE(TRIM(full_name), ' ', '')) < 1 THEN NULL
        WHEN SUBSTRING_INDEX(TRIM(full_name), ' ', 1) = SUBSTRING_INDEX(TRIM(full_name), ' ', -1) THEN NULL
        ELSE TRIM(REPLACE(REPLACE(TRIM(full_name), SUBSTRING_INDEX(TRIM(full_name), ' ', 1), ''), SUBSTRING_INDEX(TRIM(full_name), ' ', -1), ''))
      END
    WHERE (full_name IS NOT NULL AND full_name != '') AND (first_name IS NULL OR first_name = '');
    UPDATE portal_users SET first_name = 'Unknown' WHERE first_name IS NULL OR first_name = '';
    UPDATE portal_users SET last_name = first_name WHERE last_name IS NULL OR last_name = '';
  END IF;
END;;
DELIMITER ;
CALL backfill_from_full_name();
DROP PROCEDURE IF EXISTS backfill_from_full_name;

-- Drop full_name only if it exists (avoid error if already dropped)
DROP PROCEDURE IF EXISTS drop_full_name_if_exists;
DELIMITER ;;
CREATE PROCEDURE drop_full_name_if_exists()
BEGIN
  IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'portal_users' AND COLUMN_NAME = 'full_name') THEN
    ALTER TABLE portal_users DROP COLUMN full_name;
  END IF;
END;;
DELIMITER ;
CALL drop_full_name_if_exists();
DROP PROCEDURE IF EXISTS drop_full_name_if_exists;
