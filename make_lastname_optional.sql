-- =====================================================
-- FIX: MAKE LAST NAME OPTIONAL
-- =====================================================

ALTER TABLE portal_users 
MODIFY COLUMN last_name VARCHAR(128) NULL;
