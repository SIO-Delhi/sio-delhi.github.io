-- Circles can belong to a region (like units). If region is not set, circle is under zone directly.
-- Run after portal_regions and portal_circles exist.

ALTER TABLE portal_circles
    ADD COLUMN region_id VARCHAR(36) NULL AFTER name;
ALTER TABLE portal_circles
    ADD CONSTRAINT fk_portal_circles_region
        FOREIGN KEY (region_id) REFERENCES portal_regions(id) ON DELETE SET NULL;
