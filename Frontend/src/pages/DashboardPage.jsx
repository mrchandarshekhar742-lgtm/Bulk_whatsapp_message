import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MdPhoneAndroid, 
  MdSend, 
  MdError, 
  MdCheckCircle, 
  MdSchedule,
  MdTrendingUp,
  MdSpeed,
  MdBattery90,
  MdSignalWifi4Bar,
  MdHealthAndSafety,
  MdInsights,
  MdAutoAwesome,
  MdWarning
} from 'react-icons/md';
import DashboardLayout from '../components/DashboardLayout';
import { apiClient } from '../api/client';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    total_queued: 0,
    total_sent: 0,
    total_failed: 0,
    total_delivered: 0,
    devices_online: 0,
    devices_total: 0,
  });
  
  const [devices, setDevices] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);
  const [campaignInsights, setCampaignInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 15 seconds (reduced frequency to prevent rate limiting)
    const interval = setInterval(fetchDashboardData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, devicesRes, logsRes, healthRes, insightsRes] = await Promise.all([
        apiClient.get('/campaigns/stats'),
        apiClient.get('/devices'),
        apiClient.get('/campaigns/logs?limit=5'),
        apiClient.get('/devices/health-summary').catch(() => ({ data: null })),
        apiClient.get('/campaigns/insights').catch(() => ({ data: null }))
      ]);
      
      setStats(statsRes.data.stats);
      setDevices(devicesRes.data.devices);
      setRecentLogs(logsRes.data.logs);
      setHealthSummary(healthRes.data);
      setCampaignInsights(insightsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const successRate = stats.total_sent + stats.total_failed > 0 
    ? Math.round((stats.total_sent / (stats.total_sent + stats.total_failed)) * 100)
    : 0;

  const onlineDevices = devices.filter(d => d.is_online);
  const totalCapacity = devices.reduce((sum, device) => 
    sum + (device.daily_limit - device.messages_sent_today), 0
  );

  const getHealthColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 75) return 'text-blue-600 bg-blue-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthStatus = (score) => {
    if (score >= 90) return 'EXCELLENT';
    if (score >= 75) return 'GOOD';
    if (score >= 60) return 'FAIR';
    if (score >= 40) return 'POOR';
    return 'CRITICAL';
  };

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white"
        >
          <h2 className="text-2xl font-bold mb-2">Welcome to WhatsApp Pro</h2>
          <p className="text-primary-100">
            Manage your bulk messaging campaigns with advanced analytics and real-time monitoring
          </p>
        </motion.div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MdSchedule className="text-blue-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Queued</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_queued}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <MdSend className="text-green-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Sent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_sent}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <MdError className="text-red-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_failed}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MdTrendingUp className="text-purple-600 text-xl" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{successRate}%</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Device Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Device Status</h3>
            <MdPhoneAndroid className="text-gray-400 text-xl" />
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Online Devices</span>
              <span className="text-sm font-medium text-green-600">
                {stats.devices_online}/{stats.devices_total}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Capacity</span>
              <span className="text-sm font-medium text-blue-600">{totalCapacity}</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(stats.devices_online / Math.max(stats.devices_total, 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <MdSpeed className="text-gray-400 text-xl" />
          </div>
          
          <div className="space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              recentLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded-full ${
                      log.status === 'SENT' ? 'bg-green-100' :
                      log.status === 'FAILED' ? 'bg-red-100' :
                      'bg-yellow-100'
                    }`}>
                      {log.status === 'SENT' ? (
                        <MdCheckCircle className="text-green-600 text-sm" />
                      ) : log.status === 'FAILED' ? (
                        <MdError className="text-red-600 text-sm" />
                      ) : (
                        <MdSchedule className="text-yellow-600 text-sm" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {log.recipient_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {log.Device?.device_label || 'Unknown Device'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    log.status === 'SENT' ? 'bg-green-100 text-green-700' :
                    log.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {log.status}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Online Devices Grid */}
      {onlineDevices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Online Devices</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {onlineDevices.map((device, index) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{device.device_label}</h4>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-green-600">Online</span>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Messages Today</span>
                    <span className="font-medium">
                      {device.messages_sent_today}/{device.daily_limit}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stage</span>
                    <span className="font-medium text-blue-600">{device.warmup_stage}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(device.messages_sent_today / device.daily_limit) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}