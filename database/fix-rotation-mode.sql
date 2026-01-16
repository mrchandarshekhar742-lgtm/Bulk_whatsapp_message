-- Fix rotation_mode column to support SMART_ROTATION
-- Run this on VPS database

USE bulk_messaging;

-- Alter the rotation_mode column to include SMART_ROTATION
ALTER TABLE campaigns 
MODIFY COLUMN rotation_mode ENUM('RANDOM', 'ROUND_ROBIN', 'LEAST_USED', 'WARMUP_AWARE', 'SMART_ROTATION') 
DEFAULT 'SMART_ROTATION';

-- Verify the change
DESCRIBE campaigns;

SELECT 'rotation_mode column updated successfully!' AS status;
