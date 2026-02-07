-- Allow portal_users.phone to be NULL so members without mobile numbers can be stored.
-- Run once on existing databases that were created with phone NOT NULL.

ALTER TABLE portal_users MODIFY COLUMN phone VARCHAR(20) NULL;
