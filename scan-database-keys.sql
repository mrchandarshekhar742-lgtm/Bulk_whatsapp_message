-- ============================================================================
-- DATABASE KEY SCANNER - Check all tables for too many indexes
-- ============================================================================
-- Run: mysql -u whatsapp_user -p bulk_whatsapp_sms < scan-database-keys.sql

USE bulk_whatsapp_sms;

-- Scan all tables for index count
SELECT 
    table_name,
    COUNT(DISTINCT index_name) as total_indexes,
    GROUP_CONCAT(DISTINCT index_name ORDER BY index_name SEPARATOR ', ') as index_list
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE table_schema = 'bulk_whatsapp_sms'
GROUP BY table_name
ORDER BY total_indexes DESC;

-- Show detailed index info for tables with most indexes
SELECT 
    table_name,
    index_name,
    non_unique,
    seq_in_index,
    column_name,
    index_type
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE table_schema = 'bulk_whatsapp_sms'
ORDER BY table_name, index_name, seq_in_index;

-- Check foreign key constraints
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms'
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;
