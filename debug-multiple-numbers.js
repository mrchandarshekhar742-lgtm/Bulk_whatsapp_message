// Debug script for multiple numbers issue
const { Device, DeviceLog, DeviceCommand } = require('./backend/src/models');

async function debugMultipleNumbers() {
  console.log('🔍 Debugging Multiple Numbers Issue...\n');

  try {
    // Check devices
    const devices = await Device.findAll();
    console.log('📱 Available Devices:');
    devices.forEach(device => {
      console.log(`  - ID: ${device.id}, Label: ${device.device_label}`);
      console.log(`    Online: ${device.is_online}, Active: ${device.is_active}`);
      console.log(`    Messages Today: ${device.messages_sent_today}/${device.daily_limit}`);
      console.log('');
    });

    // Check recent logs
    const recentLogs = await DeviceLog.findAll({
      limit: 10,
      order: [['created_at', 'DESC']],
      include: [{ model: Device, attributes: ['device_label'] }]
    });

    console.log('📋 Recent Campaign Logs:');
    recentLogs.forEach(log => {
      console.log(`  - ${log.recipient_number}: ${log.status}`);
      console.log(`    Device: ${log.Device?.device_label || 'Unknown'}`);
      console.log(`    Message: ${log.message_content.substring(0, 50)}...`);
      if (log.error_message) {
        console.log(`    Error: ${log.error_message}`);
      }
      console.log('');
    });

    // Check pending commands
    const pendingCommands = await DeviceCommand.findAll({
      where: { status: 'PENDING' },
      limit: 10,
      order: [['created_at', 'DESC']]
    });

    console.log('⏳ Pending Commands:');
    pendingCommands.forEach(cmd => {
      console.log(`  - Device ${cmd.device_id}: ${cmd.command_type}`);
      console.log(`    Payload: ${JSON.stringify(cmd.payload)}`);
      console.log('');
    });

    // Check failed logs
    const failedLogs = await DeviceLog.findAll({
      where: { status: 'FAILED' },
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    console.log('❌ Recent Failed Messages:');
    failedLogs.forEach(log => {
      console.log(`  - ${log.recipient_number}: ${log.error_message || 'No error message'}`);
    });

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

// Run debug
debugMultipleNumbers();