-- ============================================================================
-- COMPLETE VPS DATABASE SCHEMA FIXES
-- ============================================================================
-- This script fixes ALL database schema mismatches on VPS

USE bulk_whatsapp_sms;

-- ============================================================================
-- 1. FIX CAMPAIGNS TABLE  
-- ============================================================================
-- Add missing columns to campaigns table
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' 
     AND TABLE_NAME = 'campaigns' 
     AND COLUMN_NAME = 'excel_record_id') = 0,
    'ALTER TABLE campaigns ADD COLUMN excel_record_id INT NULL AFTER template_id',
    'SELECT "excel_record_id column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' 
     AND TABLE_NAME = 'campaigns' 
     AND COLUMN_NAME = 'rotation_mode') = 0,
    'ALTER TABLE campaigns ADD COLUMN rotation_mode ENUM("RANDOM", "ROUND_ROBIN", "LEAST_USED", "WARMUP_AWARE") DEFAULT "WARMUP_AWARE" AFTER pending_count',
    'SELECT "rotation_mode column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' 
     AND TABLE_NAME = 'campaigns' 
     AND COLUMN_NAME = 'selected_devices') = 0,
    'ALTER TABLE campaigns ADD COLUMN selected_devices JSON NULL AFTER rotation_mode',
    'SELECT "selected_devices column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' 
     AND TABLE_NAME = 'campaigns' 
     AND COLUMN_NAME = 'device_message_distribution') = 0,
    'ALTER TABLE campaigns ADD COLUMN device_message_distribution JSON NULL AFTER selected_devices',
    'SELECT "device_message_distribution column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' 
     AND TABLE_NAME = 'campaigns' 
     AND COLUMN_NAME = 'timing_config') = 0,
    'ALTER TABLE campaigns ADD COLUMN timing_config JSON NULL AFTER device_message_distribution',
    'SELECT "timing_config column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' 
     AND TABLE_NAME = 'campaigns' 
     AND COLUMN_NAME = 'timing_analytics') = 0,
    'ALTER TABLE campaigns ADD COLUMN timing_analytics JSON NULL AFTER timing_config',
    'SELECT "timing_analytics column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 2. FIX EXCEL_RECORDS TABLE
-- ============================================================================
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' 
     AND TABLE_NAME = 'excel_records' 
     AND COLUMN_NAME = 'file_size') = 0,
    'ALTER TABLE excel_records ADD COLUMN file_size INT NOT NULL DEFAULT 0 AFTER file_path',
    'SELECT "file_size column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 3. FIX DEVICE_LOGS TABLE
-- ============================================================================
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' 
     AND TABLE_NAME = 'device_logs' 
     AND COLUMN_NAME = 'time_gap_ms') = 0,
    'ALTER TABLE device_logs ADD COLUMN time_gap_ms INT NULL COMMENT "Milliseconds between messages" AFTER delivered_at',
    'SELECT "time_gap_ms column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' 
     AND TABLE_NAME = 'device_logs' 
     AND COLUMN_NAME = 'delivery_time_ms') = 0,
    'ALTER TABLE device_logs ADD COLUMN delivery_time_ms INT NULL COMMENT "Time from sent to delivered" AFTER time_gap_ms',
    'SELECT "delivery_time_ms column already exists" as message'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 4. CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_campaigns_excel_record_id ON campaigns(excel_record_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_rotation_mode ON campaigns(rotation_mode);
CREATE INDEX IF NOT EXISTS idx_device_logs_time_gap ON device_logs(time_gap_ms);
CREATE INDEX IF NOT EXISTS idx_device_logs_delivery_time ON device_logs(delivery_time_ms);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- 5. VERIFY ALL TABLES
-- ============================================================================
SELECT 'VPS DATABASE SCHEMA FIXES COMPLETED SUCCESSFULLY!' as result;
SELECT 'Campaigns table columns:' as info;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' AND TABLE_NAME = 'campaigns'
ORDER BY ORDINAL_POSITION;

SELECT 'Excel records table columns:' as info;
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'bulk_whatsapp_sms' AND TABLE_NAME = 'excel_records'
ORDER BY ORDINAL_POSITION;