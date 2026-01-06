-- ============================================================================
-- WHATSAPP PRO - COMPLETE DATABASE SCHEMA FOR HOSTINGER
-- ============================================================================
-- Single file with all tables - Ready to import on Hostinger
-- Version: 1.0
-- Date: 2024
-- ============================================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS bulk_whatsapp_sms;
USE bulk_whatsapp_sms;

-- ============================================================================
-- PART 1: USER MANAGEMENT TABLES
-- ============================================================================

-- 1. USER ROLES
CREATE TABLE user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USERS
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_id INT NOT NULL DEFAULT 2,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    company_logo_url VARCHAR(500),
    api_key VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    FOREIGN KEY (role_id) REFERENCES user_roles(id),
    INDEX idx_email (email),
    INDEX idx_api_key (api_key),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 2: EXCEL FILE MANAGEMENT
-- ============================================================================

-- 3. EXCEL RECORDS (File uploads)
CREATE TABLE excel_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    total_rows INT DEFAULT 0,
    rows_json JSON,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 3: DEVICE MANAGEMENT (100 Mobile Phones)
-- ============================================================================

-- 4. DEVICES (Mobile Phones)
CREATE TABLE devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    device_label VARCHAR(100) NOT NULL COMMENT 'e.g. Phone-001',
    phone_number VARCHAR(20) NULL COMMENT 'WhatsApp number',
    device_ip VARCHAR(45) NULL,
    device_token VARCHAR(255) UNIQUE NOT NULL COMMENT 'Auth token for Android app',
    
    -- Status
    is_online BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Warmup System (Anti-ban)
    warmup_stage ENUM('STAGE_1', 'STAGE_2', 'STAGE_3', 'STAGE_4') DEFAULT 'STAGE_1',
    warmup_started_at DATE NULL,
    messages_sent_today INT DEFAULT 0,
    daily_limit INT DEFAULT 15 COMMENT 'Stage 1:15, 2:40, 3:100, 4:250',
    
    -- Device Info
    battery_level INT NULL,
    network_type VARCHAR(50) NULL COMMENT 'WiFi, 4G, 5G',
    android_version VARCHAR(50) NULL,
    app_version VARCHAR(50) NULL,
    
    -- Stats
    last_seen TIMESTAMP NULL,
    last_message_sent_at TIMESTAMP NULL,
    total_messages_sent INT DEFAULT 0,
    total_messages_failed INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_online (is_online),
    INDEX idx_is_active (is_active),
    INDEX idx_warmup_stage (warmup_stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. DEVICE LOGS (Message Sending History)
CREATE TABLE device_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id INT NOT NULL,
    campaign_id INT NULL,
    excel_record_id INT NULL,
    excel_row_index INT NULL,
    
    recipient_number VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    media_url VARCHAR(500) NULL,
    
    status ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'PENDING') DEFAULT 'QUEUED',
    error_message TEXT NULL,
    
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    
    -- NEW: Time Tracking Features
    time_gap_ms INT NULL COMMENT 'Milliseconds between this message and previous message from same device',
    delivery_time_ms INT NULL COMMENT 'Time from sent to delivered in milliseconds',
    
    device_ip VARCHAR(45) NULL,
    network_type VARCHAR(50) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (excel_record_id) REFERENCES excel_records(id) ON DELETE SET NULL,
    
    INDEX idx_device_id (device_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_recipient (recipient_number),
    INDEX idx_time_gap (time_gap_ms),
    INDEX idx_delivery_time (delivery_time_ms)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. DEVICE COMMANDS (Command Queue for Android App)
CREATE TABLE device_commands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id INT NOT NULL,
    command_type ENUM('SEND_MESSAGE', 'SEND_MEDIA', 'SYNC_STATUS', 'RESTART', 'UPDATE_CONFIG') NOT NULL,
    
    payload JSON NOT NULL COMMENT '{number, message, mediaUrl}',
    
    status ENUM('PENDING', 'SENT', 'ACKNOWLEDGED', 'COMPLETED', 'FAILED') DEFAULT 'PENDING',
    priority INT DEFAULT 5,
    
    sent_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    error_message TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    
    INDEX idx_device_id (device_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. DEVICE CAMPAIGNS (Campaign-Device Mapping with Message Allocation)
CREATE TABLE device_campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    device_id INT NOT NULL,
    
    -- NEW: Per-Device Message Management
    assigned_message_count INT DEFAULT 0 COMMENT 'How many messages this device should send in this campaign',
    messages_sent_in_campaign INT DEFAULT 0 COMMENT 'How many messages this device has sent in this campaign',
    
    assigned_count INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    
    UNIQUE KEY unique_campaign_device (campaign_id, device_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_device_id (device_id),
    INDEX idx_assigned_count (assigned_message_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 4: CAMPAIGN MANAGEMENT
-- ============================================================================

-- 8. CAMPAIGNS
CREATE TABLE campaigns (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    excel_record_id INT NULL COMMENT 'Which Excel file to use',
    
    campaign_type ENUM('STANDARD', 'SCHEDULED', 'RECURRING') DEFAULT 'STANDARD',
    status ENUM('DRAFT', 'PENDING', 'RUNNING', 'COMPLETED', 'PAUSED', 'CANCELLED') DEFAULT 'DRAFT',
    
    message_content TEXT NOT NULL,
    
    total_contacts INT DEFAULT 0,
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    pending_count INT DEFAULT 0,
    
    -- Device Rotation & Management
    rotation_mode ENUM('RANDOM', 'ROUND_ROBIN', 'LEAST_USED', 'WARMUP_AWARE') DEFAULT 'WARMUP_AWARE',
    selected_devices JSON NULL COMMENT 'Array of device IDs',
    device_message_distribution JSON NULL COMMENT 'Per-device message allocation: {deviceId: messageCount}',
    
    -- NEW: Timing Configuration & Analytics
    timing_config JSON NULL COMMENT 'Timing settings: {min_delay, max_delay, strategy, custom_delays}',
    timing_analytics JSON NULL COMMENT 'Timing stats: {avg_gap, min_gap, max_gap, avg_delivery_time}',
    
    scheduled_at TIMESTAMP NULL,
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    
    priority ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'MEDIUM',
    rate_limit INT DEFAULT 100,
    delay_between_messages INT DEFAULT 1000,
    
    metadata JSON,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (excel_record_id) REFERENCES excel_records(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. CAMPAIGN CONTACTS
CREATE TABLE campaign_contacts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    campaign_id INT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    custom_data JSON,
    
    status ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED') DEFAULT 'PENDING',
    sent_at TIMESTAMP NULL,
    failed_reason VARCHAR(255),
    retry_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
    
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_status (status),
    INDEX idx_phone_number (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 5: SYSTEM TABLES
-- ============================================================================

-- 10. AUDIT LOGS
CREATE TABLE audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    status ENUM('SUCCESS', 'FAILURE') DEFAULT 'SUCCESS',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. NOTIFICATIONS
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('INFO', 'SUCCESS', 'WARNING', 'ERROR') DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500),
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- PART 6: INSERT DEFAULT DATA
-- ============================================================================

-- Insert User Roles
INSERT INTO user_roles (name, description, permissions) VALUES
('ADMIN', 'Administrator with full access', JSON_OBJECT('all', true)),
('USER', 'Regular user', JSON_OBJECT('campaigns', true, 'templates', true, 'devices', true));

-- ============================================================================
-- PART 7: STORED PROCEDURES (Auto-maintenance)
-- ============================================================================

-- Reset daily message counts (Run at midnight)
DELIMITER //
CREATE PROCEDURE reset_daily_device_counts()
BEGIN
    UPDATE devices SET messages_sent_today = 0;
END //
DELIMITER ;

-- Update warmup stages automatically
DELIMITER //
CREATE PROCEDURE update_device_warmup_stages()
BEGIN
    -- Stage 1 → Stage 2 (after 3 days)
    UPDATE devices 
    SET warmup_stage = 'STAGE_2', daily_limit = 40
    WHERE warmup_stage = 'STAGE_1' 
    AND warmup_started_at IS NOT NULL
    AND DATEDIFF(CURDATE(), warmup_started_at) >= 3;
    
    -- Stage 2 → Stage 3 (after 7 days)
    UPDATE devices 
    SET warmup_stage = 'STAGE_3', daily_limit = 100
    WHERE warmup_stage = 'STAGE_2' 
    AND warmup_started_at IS NOT NULL
    AND DATEDIFF(CURDATE(), warmup_started_at) >= 7;
    
    -- Stage 3 → Stage 4 (after 14 days)
    UPDATE devices 
    SET warmup_stage = 'STAGE_4', daily_limit = 250
    WHERE warmup_stage = 'STAGE_3' 
    AND warmup_started_at IS NOT NULL
    AND DATEDIFF(CURDATE(), warmup_started_at) >= 14;
END //
DELIMITER ;

-- ============================================================================
-- PART 8: PERFORMANCE INDEXES
-- ============================================================================

CREATE INDEX idx_device_logs_device_status ON device_logs(device_id, status);
CREATE INDEX idx_device_commands_device_status ON device_commands(device_id, status);
CREATE INDEX idx_devices_online_active ON devices(is_online, is_active);
CREATE INDEX idx_campaign_contacts_campaign_status ON campaign_contacts(campaign_id, status);

-- ============================================================================
-- SETUP COMPLETE! 
-- ============================================================================
-- Total Tables: 11
-- - Users & Roles: 2 tables
-- - Excel Management: 1 table
-- - Device Management: 4 tables
-- - Campaign Management: 2 tables
-- - System: 2 tables
--
-- Features:
-- ✓ User authentication
-- ✓ Excel file upload & management
-- ✓ 100 device management
-- ✓ WebSocket device communication
-- ✓ Smart rotation engine
-- ✓ Anti-ban warmup system
-- ✓ Campaign management
-- ✓ Real-time logging
-- ✓ Auto-maintenance procedures
--
-- Next Steps:
-- 1. Import this file in Hostinger phpMyAdmin
-- 2. Create a user account via backend API
-- 3. Add devices via dashboard
-- 4. Start sending campaigns!
-- ============================================================================
