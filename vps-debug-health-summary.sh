#!/bin/bash

# ============================================================================
# VPS Health Summary Debug Script
# ============================================================================

echo "=== Starting Health Summary Debug ==="

# Monitor PM2 logs in real-time for health-summary calls
echo "Monitoring health-summary endpoint calls..."
echo "Please trigger the dashboard error now..."

pm2 logs bulk-messaging-backend --lines 0 | grep -E "(health-summary|error|Error)" --line-buffered

echo "=== Debug Complete ==="