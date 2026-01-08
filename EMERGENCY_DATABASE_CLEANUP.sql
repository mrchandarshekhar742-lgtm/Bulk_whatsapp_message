-- ============================================================================
-- EMERGENCY DATABASE CLEANUP - Fix "Too many keys specified" Error
-- ============================================================================
-- Execute these commands on VPS MySQL to fix duplicate indexes
-- Run: mysql -u whatsapp_user -p bulk_whatsapp_sms < EMERGENCY_DATABASE_CLEANUP.sql

USE bulk_whatsapp_sms;

-- Step 1: Show current indexes on users table (for verification)
SHOW INDEX FROM users;

-- Step 2: Drop ALL duplicate indexes on users table
-- Keep only essential unique constraints

-- Drop duplicate email indexes (keep only the unique constraint)
ALTER TABLE users DROP INDEX IF EXISTS idx_email;
ALTER TABLE users DROP INDEX IF EXISTS email;
ALTER TABLE users DROP INDEX IF EXISTS users_email_unique;
ALTER TABLE users DROP INDEX IF EXISTS email_unique;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_email;
ALTER TABLE users DROP INDEX IF EXISTS users_email_index;

-- Drop duplicate api_key indexes (keep only the unique constraint)  
ALTER TABLE users DROP INDEX IF EXISTS idx_api_key;
ALTER TABLE users DROP INDEX IF EXISTS api_key;
ALTER TABLE users DROP INDEX IF EXISTS users_api_key_unique;
ALTER TABLE users DROP INDEX IF EXISTS api_key_unique;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_api_key;
ALTER TABLE users DROP INDEX IF EXISTS users_api_key_index;

-- Drop other duplicate indexes
ALTER TABLE users DROP INDEX IF EXISTS idx_created_at;
ALTER TABLE users DROP INDEX IF EXISTS created_at;
ALTER TABLE users DROP INDEX IF EXISTS users_created_at_index;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_created_at;

-- Step 3: Ensure only essential unique constraints exist
-- Re-add ONLY the necessary unique constraints if they don't exist

-- Check and add email unique constraint if missing
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = 'bulk_whatsapp_sms' 
     AND table_name = 'users' 
     AND index_name = 'email' 
     AND non_unique = 0) = 0,
    'ALTER TABLE users ADD UNIQUE KEY email (email);',
    'SELECT "Email unique constraint already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add api_key unique constraint if missing
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
     WHERE table_schema = 'bulk_whatsapp_sms' 
     AND table_name = 'users' 
     AND index_name = 'api_key' 
     AND non_unique = 0) = 0,
    'ALTER TABLE users ADD UNIQUE KEY api_key (api_key);',
    'SELECT "API key unique constraint already exists";'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Verify final index count (should be much less than 64)
SELECT 
    COUNT(*) as total_indexes,
    GROUP_CONCAT(DISTINCT index_name) as index_names
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE table_schema = 'bulk_whatsapp_sms' 
AND table_name = 'users';

-- Step 5: Show final indexes for verification
SHOW INDEX FROM users;

-- ============================================================================
-- CLEANUP COMPLETE
-- ============================================================================