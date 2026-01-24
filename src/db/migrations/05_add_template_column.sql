-- Add template column to sections table
ALTER TABLE sections ADD COLUMN IF NOT EXISTS template VARCHAR(50) DEFAULT 'standard';

-- Update existing sections with appropriate templates based on their type
UPDATE sections SET template = 'standard' WHERE template IS NULL;

-- Set specific templates for known section types
UPDATE sections SET template = 'media' WHERE id = 'media';
UPDATE sections SET template = 'leadership' WHERE id = 'leadership';
UPDATE sections SET template = 'resource' WHERE id = 'more';
UPDATE sections SET template = 'resource' WHERE id = 'nodes';
