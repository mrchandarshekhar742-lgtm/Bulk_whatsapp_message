-- ============================================================================
-- FIX TOO MANY KEYS ERROR - Complete Database Cleanup
-- ============================================================================
-- This will remove duplicate and unnecessary indexes from all tables
-- Run: mysql -u whatsapp_user -p bulk_whatsapp_sms < fix-too-many-keys.sql

USE bulk_whatsapp_sms;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- TABLE: users - Remove duplicate indexes
-- ============================================================================

-- Drop all duplicate email indexes (keep only unique constraint)
ALTER TABLE users DROP INDEX IF EXISTS idx_email;
ALTER TABLE users DROP INDEX IF EXISTS users_email_unique;
ALTER TABLE users DROP INDEX IF EXISTS email_unique;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_email;
ALTER TABLE users DROP INDEX IF EXISTS users_email_index;

-- Drop all duplicate api_key indexes (keep only unique constraint)
ALTER TABLE users DROP INDEX IF EXISTS idx_api_key;
ALTER TABLE users DROP INDEX IF EXISTS users_api_key_unique;
ALTER TABLE users DROP INDEX IF EXISTS api_key_unique;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_api_key;
ALTER TABLE users DROP INDEX IF EXISTS users_api_key_index;

-- Drop duplicate created_at indexes
ALTER TABLE users DROP INDEX IF EXISTS idx_created_at;
ALTER TABLE users DROP INDEX IF EXISTS users_created_at_index;
ALTER TABLE users DROP INDEX IF EXISTS idx_users_created_at;

-- ============================================================================
-- TABLE: user_roles - Remove duplicate indexes
-- ============================================================================

ALTER TABLE user_roles DROP INDEX IF EXISTS idx_name;
ALTER TABLE user_roles DROP INDEX IF EXISTS user_roles_name_index;
ALTER TABLE user_roles DROP INDEX IF EXISTS idx_user_roles_name;

-- ============================================================================
-- TABLE: devices - Remove duplicate indexes
-- ============================================================================

ALTER TABLE devices DROP INDEX IF EXISTS idx_user_id;
ALTER TABLE devices DROP INDEX IF EXISTS devices_user_id_index;
ALTER TABLE devices DROP INDEX IF EXISTS idx_devices_user_id;

ALTER TABLE devices DROP INDEX IF EXISTS idx_is_online;
ALTER TABLE devices DROP INDEX IF EXISTS devices_is_online_index;

ALTER TABLE devices DROP INDEX IF EXISTS idx_is_active;
ALTER TABLE devices DROP INDEX IF EXISTS devices_is_active_index;

ALTER TABLE devices DROP INDEX IF EXISTS idx_warmup_stage;
ALTER TABLE devices DROP INDEX IF EXISTS devices_warmup_stage_index;

ALTER TABLE devices DROP INDEX IF EXISTS idx_devices_online_active;
ALTER TABLE devices DROP INDEX IF EXISTS devices_online_active_index;

-- ============================================================================
-- TABLE: device_logs - Remove duplicate indexes
-- ============================================================================

ALTER TABLE device_logs DROP INDEX IF EXISTS idx_device_id;
ALTER TABLE device_logs DROP INDEX IF EXISTS device_logs_device_id_index;

ALTER TABLE device_logs DROP INDEX IF EXISTS idx_status;
ALTER TABLE device_logs DROP INDEX IF EXISTS device_logs_status_index;

ALTER TABLE device_logs DROP INDEX IF EXISTS idx_created_at;
ALTER TABLE device_logs DROP INDEX IF EXISTS device_logs_created_at_index;

ALTER TABLE device_logs DROP INDEX IF EXISTS idx_recipient;
ALTER TABLE device_logs DROP INDEX IF EXISTS device_logs_recipient_index;

ALTER TABLE device_logs DROP INDEX IF EXISTS idx_time_gap;
ALTER TABLE device_logs DROP INDEX IF EXISTS device_logs_time_gap_index;

ALTER TABLE device_logs DROP INDEX IF EXISTS idx_delivery_time;
ALTER TABLE device_logs DROP INDEX IF EXISTS device_logs_delivery_time_index;

ALTER TABLE device_logs DROP INDEX IF EXISTS idx_device_logs_device_status;
ALTER TABLE device_logs DROP INDEX IF EXISTS device_logs_device_status_index;

-- ============================================================================
-- TABLE: device_commands - Remove duplicate indexes
-- ============================================================================

ALTER TABLE device_commands DROP INDEX IF EXISTS idx_device_id;
ALTER TABLE device_commands DROP INDEX IF EXISTS device_commands_device_id_index;

ALTER TABLE device_commands DROP INDEX IF EXISTS idx_status;
ALTER TABLE device_commands DROP INDEX IF EXISTS device_commands_status_index;

ALTER TABLE device_commands DROP INDEX IF EXISTS idx_priority;
ALTER TABLE device_commands DROP INDEX IF EXISTS device_commands_priority_index;

ALTER TABLE device_commands DROP INDEX IF EXISTS idx_device_commands_device_status;
ALTER TABLE device_commands DROP INDEX IF EXISTS device_commands_device_status_index;

-- ============================================================================
-- TABLE: device_campaigns - Remove duplicate indexes
-- ============================================================================

ALTER TABLE device_campaigns DROP INDEX IF EXISTS idx_campaign_id;
ALTER TABLE device_campaigns DROP INDEX IF EXISTS device_campaigns_campaign_id_index;

ALTER TABLE device_campaigns DROP INDEX IF EXISTS idx_device_id;
ALTER TABLE device_campaigns DROP INDEX IF EXISTS device_campaigns_device_id_index;

ALTER TABLE device_campaigns DROP INDEX IF EXISTS idx_assigned_count;
ALTER TABLE device_campaigns DROP INDEX IF EXISTS device_campaigns_assigned_count_index;

-- ============================================================================
-- TABLE: campaigns - Remove duplicate indexes
-- ============================================================================

ALTER TABLE campaigns DROP INDEX IF EXISTS idx_user_id;
ALTER TABLE campaigns DROP INDEX IF EXISTS campaigns_user_id_index;

ALTER TABLE campaigns DROP INDEX IF EXISTS idx_status;
ALTER TABLE campaigns DROP INDEX IF EXISTS campaigns_status_index;

ALTER TABLE campaigns DROP INDEX IF EXISTS idx_created_at;
ALTER TABLE campaigns DROP INDEX IF EXISTS campaigns_created_at_index;

-- ============================================================================
-- TABLE: campaign_contacts - Remove duplicate indexes
-- ============================================================================

ALTER TABLE campaign_contacts DROP INDEX IF EXISTS idx_campaign_id;
ALTER TABLE campaign_contacts DROP INDEX IF EXISTS campaign_contacts_campaign_id_index;

ALTER TABLE campaign_contacts DROP INDEX IF EXISTS idx_status;
ALTER TABLE campaign_contacts DROP INDEX IF EXISTS campaign_contacts_status_index;

ALTER TABLE campaign_contacts DROP INDEX IF EXISTS idx_phone_number;
ALTER TABLE campaign_contacts DROP INDEX IF EXISTS campaign_contacts_phone_number_index;

ALTER TABLE campaign_contacts DROP INDEX IF EXISTS idx_campaign_contacts_campaign_status;
ALTER TABLE campaign_contacts DROP INDEX IF EXISTS campaign_contacts_campaign_status_index;

-- ============================================================================
-- TABLE: excel_records - Remove duplicate indexes
-- ============================================================================

ALTER TABLE excel_records DROP INDEX IF EXISTS idx_user_id;
ALTER TABLE excel_records DROP INDEX IF EXISTS excel_records_user_id_index;

ALTER TABLE excel_records DROP INDEX IF EXISTS idx_uploaded_at;
ALTER TABLE excel_records DROP INDEX IF EXISTS excel_records_uploaded_at_index;

-- ============================================================================
-- TABLE: audit_logs - Remove duplicate indexes
-- ============================================================================

ALTER TABLE audit_logs DROP INDEX IF EXISTS idx_user_id;
ALTER TABLE audit_logs DROP INDEX IF EXISTS audit_logs_user_id_index;

ALTER TABLE audit_logs DROP INDEX IF EXISTS idx_action;
ALTER TABLE audit_logs DROP INDEX IF EXISTS audit_logs_action_index;

ALTER TABLE audit_logs DROP INDEX IF EXISTS idx_created_at;
ALTER TABLE audit_logs DROP INDEX IF EXISTS audit_logs_created_at_index;

-- ============================================================================
-- TABLE: notifications - Remove duplicate indexes
-- ============================================================================

ALTER TABLE notifications DROP INDEX IF EXISTS idx_user_id;
ALTER TABLE notifications DROP INDEX IF EXISTS notifications_user_id_index;

ALTER TABLE notifications DROP INDEX IF EXISTS idx_is_read;
ALTER TABLE notifications DROP INDEX IF EXISTS notifications_is_read_index;

ALTER TABLE notifications DROP INDEX IF EXISTS idx_created_at;
ALTER TABLE notifications DROP INDEX IF EXISTS notifications_created_at_index;

-- ============================================================================
-- Re-enable foreign key checks
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- Verify cleanup - Show remaining indexes per table
-- ============================================================================

SELECT 
    table_name,
    COUNT(DISTINCT index_name) as total_indexes,
    GROUP_CONCAT(DISTINCT index_name ORDER BY index_name SEPARATOR ', ') as remaining_indexes
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE table_schema = 'bulk_whatsapp_sms'
GROUP BY table_name
ORDER BY total_indexes DESC;

-- ============================================================================
-- CLEANUP COMPLETE!
-- ============================================================================
-- All duplicate indexes removed
-- Only essential indexes remain:
-- - PRIMARY keys
-- - UNIQUE constraints (email, api_key, device_token)
-- - Foreign key indexes
-- - One index per column (no duplicates)
-- ============================================================================
