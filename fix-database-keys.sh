#!/bin/bash

# ============================================================================
# VPS Database Key Fix Script
# ============================================================================
# This script will scan and fix "too many keys" error in MySQL database
# ============================================================================

echo "=========================================="
echo "Database Key Scanner & Fixer"
echo "=========================================="
echo ""

# Database credentials
DB_USER="whatsapp_user"
DB_PASS="WhatsApp@2025!"
DB_NAME="bulk_whatsapp_sms"

echo "Step 1: Scanning database for index count..."
echo "=========================================="
mysql -u $DB_USER -p$DB_PASS $DB_NAME < scan-database-keys.sql > database-scan-report.txt 2>&1

echo ""
echo "Scan complete! Check database-scan-report.txt for details"
echo ""

read -p "Do you want to proceed with fixing duplicate indexes? (yes/no): " confirm

if [ "$confirm" = "yes" ]; then
    echo ""
    echo "Step 2: Fixing duplicate indexes..."
    echo "=========================================="
    
    # Backup database first
    echo "Creating backup..."
    mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > backup_before_key_fix_$(date +%Y%m%d_%H%M%S).sql
    
    echo "Backup created successfully!"
    echo ""
    
    # Run fix script
    echo "Removing duplicate indexes..."
    mysql -u $DB_USER -p$DB_PASS $DB_NAME < fix-too-many-keys.sql > fix-report.txt 2>&1
    
    echo ""
    echo "=========================================="
    echo "Fix complete! Check fix-report.txt for details"
    echo "=========================================="
    echo ""
    echo "Summary:"
    echo "- Backup created: backup_before_key_fix_*.sql"
    echo "- Scan report: database-scan-report.txt"
    echo "- Fix report: fix-report.txt"
    echo ""
    echo "Your database should now be working properly!"
else
    echo "Fix cancelled. No changes made to database."
fi
