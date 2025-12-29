const mysql = require('mysql2/promise');

async function debugMultipleNumbers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'whatsapp_user',
        password: 'WhatsApp@2025!',
        database: 'bulk_whatsapp_sms'
    });

    try {
        console.log('🔍 Debugging multiple numbers campaign creation...');
        
        // Check devices
        const [devices] = await connection.execute('SELECT * FROM devices WHERE status = "online"');
        console.log('📱 Online devices:', devices.length);
        
        // Check campaigns
        const [campaigns] = await connection.execute('SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 5');
        console.log('📊 Recent campaigns:', campaigns.length);
        
        // Check device rotation
        const [logs] = await connection.execute('SELECT * FROM device_logs ORDER BY created_at DESC LIMIT 10');
        console.log('📝 Recent device logs:', logs.length);
        
        console.log('✅ Debug complete');
        
    } catch (error) {
        console.error('❌ Debug error:', error);
    } finally {
        await connection.end();
    }
}

debugMultipleNumbers();