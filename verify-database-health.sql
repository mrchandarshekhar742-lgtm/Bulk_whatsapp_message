-- ============================================================================
-- DATABASE HEALTH CHECK - Verify database is working properly
-- ============================================================================
-- Run: mysql -u whatsapp_user -p bulk_whatsapp_sms < verify-database-health.sql

USE bulk_whatsapp_sms;

-- ============================================================================
-- 1. CHECK INDEX COUNT PER TABLE
-- ============================================================================
SELECT '=== INDEX COUNT PER TABLE ===' as '';

SELECT 
    table_name,
    COUNT(DISTINCT index_name) as total_indexes,
    CASE 
        WHEN COUNT(DISTINCT index_name) > 50 THEN '❌ TOO MANY'
        WHEN COUNT(DISTINCT index_name) > 30 THEN '⚠️ HIGH'
        WHEN COUNT(DISTINCT index_name) > 15 THEN '✓ MODERATE'
        ELSE '✅ GOOD'
    END as status
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE table_schema = 'bulk_whatsapp_sms'
GROUP BY table_name
ORDER BY total_indexes DESC;

-- ============================================================================
-- 2. CHECK FOR DUPLICATE INDEXES
-- ============================================================================
SELECT '=== DUPLICATE INDEXES ===' as '';

SELECT 
    table_name,
    column_name,
    COUNT(DISTINCT index_name) as duplicate_count,
    GROUP_CONCAT(DISTINCT index_name) as duplicate_indexes
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE table_schema = 'bulk_whatsapp_sms'
GROUP BY table_name, column_name
HAVING COUNT(DISTINCT index_name) > 1
ORDER BY duplicate_count DESC;

-- ============================================================================
-- 3. CHECK FOREIGN KEY CONSTRAINTS
-- ============================================================================
SELECT '=== FOREIGN KEY CONSTRAINTS ===' as '';

SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms'
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

-- ============================================================================
-- 4. CHECK TABLE SIZES
-- ============================================================================
SELECT '=== TABLE SIZES ===' as '';

SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb,
    table_rows,
    ROUND((index_length / 1024 / 1024), 2) as index_size_mb
FROM information_schema.TABLES
WHERE table_schema = 'bulk_whatsapp_sms'
ORDER BY (data_length + index_length) DESC;

-- ============================================================================
-- 5. CHECK RECORD COUNTS
-- ============================================================================
SELECT '=== RECORD COUNTS ===' as '';

SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'devices', COUNT(*) FROM devices
UNION ALL
SELECT 'campaigns', COUNT(*) FROM campaigns
UNION ALL
SELECT 'device_logs', COUNT(*) FROM device_logs
UNION ALL
SELECT 'device_commands', COUNT(*) FROM device_commands
UNION ALL
SELECT 'excel_records', COUNT(*) FROM excel_records
UNION ALL
SELECT 'campaign_contacts', COUNT(*) FROM campaign_contacts
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

-- ============================================================================
-- 6. CHECK UNIQUE CONSTRAINTS
-- ============================================================================
SELECT '=== UNIQUE CONSTRAINTS ===' as '';

SELECT 
    table_name,
    index_name,
    GROUP_CONCAT(column_name ORDER BY seq_in_index) as columns
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE table_schema = 'bulk_whatsapp_sms'
AND non_unique = 0
AND index_name != 'PRIMARY'
GROUP BY table_name, index_name
ORDER BY table_name;

-- ============================================================================
-- 7. CHECK FOR MISSING INDEXES ON FOREIGN KEYS
-- ============================================================================
SELECT '=== FOREIGN KEYS WITHOUT INDEXES ===' as '';

SELECT 
    kcu.TABLE_NAME,
    kcu.COLUMN_NAME,
    kcu.REFERENCED_TABLE_NAME,
    CASE 
        WHEN s.index_name IS NULL THEN '❌ MISSING INDEX'
        ELSE '✅ INDEXED'
    END as index_status
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
LEFT JOIN INFORMATION_SCHEMA.STATISTICS s 
    ON kcu.TABLE_SCHEMA = s.TABLE_SCHEMA 
    AND kcu.TABLE_NAME = s.TABLE_NAME 
    AND kcu.COLUMN_NAME = s.COLUMN_NAME
WHERE kcu.TABLE_SCHEMA = 'bulk_whatsapp_sms'
AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
GROUP BY kcu.TABLE_NAME, kcu.COLUMN_NAME, kcu.REFERENCED_TABLE_NAME, s.index_name;

-- ============================================================================
-- 8. OVERALL HEALTH SUMMARY
-- ============================================================================
SELECT '=== OVERALL HEALTH SUMMARY ===' as '';

SELECT 
    'Total Tables' as metric,
    COUNT(DISTINCT table_name) as value
FROM INFORMATION_SCHEMA.TABLES
WHERE table_schema = 'bulk_whatsapp_sms'

UNION ALL

SELECT 
    'Total Indexes',
    COUNT(DISTINCT CONCAT(table_name, '.', index_name))
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE table_schema = 'bulk_whatsapp_sms'

UNION ALL

SELECT 
    'Total Foreign Keys',
    COUNT(*)
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms'
AND REFERENCED_TABLE_NAME IS NOT NULL

UNION ALL

SELECT 
    'Database Size (MB)',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2)
FROM information_schema.TABLES
WHERE table_schema = 'bulk_whatsapp_sms';

-- ============================================================================
-- HEALTH CHECK COMPLETE!
-- ============================================================================
