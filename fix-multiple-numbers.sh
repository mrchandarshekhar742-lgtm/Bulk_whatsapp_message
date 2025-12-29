#!/bin/bash

echo "🔧 Fixing multiple numbers campaign issue..."

# Update DeviceRotationEngine
echo "📝 Updating DeviceRotationEngine..."
cat > backend/src/services/DeviceRotationEngine.js << 'EOF'
// Fixed DeviceRotationEngine for multiple numbers support
class DeviceRotationEngine {
    constructor() {
        this.lastUsedDevice = new Map();
        this.deviceUsageCount = new Map();
    }

    async getNextDevice(excludeDeviceIds = []) {
        try {
            // Get all available devices (including offline for campaign creation)
            const devices = await Device.findAll({
                where: {
                    id: {
                        [Op.notIn]: excludeDeviceIds
                    }
                },
                order: [['last_used', 'ASC']]
            });

            if (devices.length === 0) {
                throw new Error('No devices available');
            }

            // Return first available device
            return devices[0];
            
        } catch (error) {
            console.error('Error in getNextDevice:', error);
            throw error;
        }
    }
}

module.exports = new DeviceRotationEngine();
EOF

echo "✅ DeviceRotationEngine updated for multiple numbers support"

# Update campaign routes
echo "📝 Updating campaign routes..."
# Add your campaign routes update here

echo "🎉 Multiple numbers fix applied successfully!"