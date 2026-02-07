-- Regions are separate entities (like units). A region has a name and a regional president assigned to it.
-- Unit belongs to a region (portal_units.region_id). Regional president is assigned to a region (portal_users.region_id when role = 'regional_president').

-- 0. Create regions table (if not exists)
CREATE TABLE IF NOT EXISTS portal_regions (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 1. Add region_id to portal_units (nullable)
ALTER TABLE portal_units
    ADD COLUMN region_id VARCHAR(36) NULL AFTER name;
ALTER TABLE portal_units
    ADD CONSTRAINT fk_portal_units_region
        FOREIGN KEY (region_id) REFERENCES portal_regions(id) ON DELETE SET NULL;

-- 2. Add region_id to portal_users (for regional_president: the region they head)
ALTER TABLE portal_users
    ADD COLUMN region_id VARCHAR(36) NULL AFTER unit_id;
ALTER TABLE portal_users
    ADD CONSTRAINT fk_portal_users_region
        FOREIGN KEY (region_id) REFERENCES portal_regions(id) ON DELETE SET NULL;
