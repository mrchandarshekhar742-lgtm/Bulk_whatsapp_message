import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdPhoneAndroid, MdAdd, MdDelete, MdRefresh, MdSignalCellularAlt, MdClose, MdTimer, MdBarChart } from 'react-icons/md';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/client';

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDevice, setNewDevice] = useState({ device_label: '', phone_number: '' });
  const [deviceToken, setDeviceToken] = useState(null);

  useEffect(() => {
    fetchDevices();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/api/devices');
      setDevices(response.data.devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddDevice = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/devices', newDevice);
      setDeviceToken(response.data.device.device_token);
      setNewDevice({ device_label: '', phone_number: '' });
      fetchDevices();
    } catch (error) {
      console.error('Error adding device:', error);
      alert('Failed to add device');
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!confirm('Are you sure you want to delete this device?')) return;
    
    try {
      await api.delete(`/api/devices/${id}`);
      fetchDevices();
    } catch (error) {
      console.error('Error deleting device:', error);
      alert('Failed to delete device');
    }
  };

  const handleToggleActive = async (device) => {
    try {
      await api.put(`/api/devices/${device.id}`, {
        is_active: !device.is_active,
      });
      fetchDevices();
    } catch (error) {
      console.error('Error updating device:', error);
      alert('Failed to update device');
    }
  };

  const getWarmupStageInfo = (stage) => {
    const stages = {
      STAGE_1: { label: 'Stage 1', limit: '15/day', color: 'text-yellow-500' },
      STAGE_2: { label: 'Stage 2', limit: '40/day', color: 'text-orange-500' },
      STAGE_3: { label: 'Stage 3', limit: '100/day', color: 'text-blue-500' },
      STAGE_4: { label: 'Stage 4', limit: '250/day', color: 'text-green-500' },
    };
    return stages[stage] || stages.STAGE_1;
  };

  if (loading) {
    return (
      <DashboardLayout title="Device Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Device Management">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <p className="text-gray-600">Manage your WhatsApp sending devices</p>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <button
            onClick={fetchDevices}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2 transition-colors"
          >
            <MdRefresh className="text-lg" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary-500/30"
          >
            <MdAdd className="text-lg" />
            <span className="text-sm font-medium">Add Device</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Total Devices</div>
          <div className="text-2xl sm:text-3xl font-bold text-gray-900">{devices.length}</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Online</div>
          <div className="text-2xl sm:text-3xl font-bold text-green-600">
            {devices.filter(d => d.is_online).length}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Active</div>
          <div className="text-2xl sm:text-3xl font-bold text-blue-600">
            {devices.filter(d => d.is_active).length}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-4 sm:p-5 rounded-xl shadow-sm border border-gray-200"
        >
          <div className="text-gray-500 text-xs sm:text-sm font-medium mb-1">Messages Today</div>
          <div className="text-2xl sm:text-3xl font-bold text-purple-600">
            {devices.reduce((sum, d) => sum + d.messages_sent_today, 0)}
          </div>
        </motion.div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {devices.map((device, index) => {
          const warmupInfo = getWarmupStageInfo(device.warmup_stage);
          const utilizationPercent = (device.messages_sent_today / device.daily_limit * 100).toFixed(0);

          return (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-4 sm:p-5 border border-gray-200 hover:border-primary-400 hover:shadow-lg transition-all duration-200"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-2.5 sm:p-3 rounded-xl ${device.is_online ? 'bg-green-50' : 'bg-gray-100'}`}>
                    <MdPhoneAndroid className={`text-xl sm:text-2xl ${device.is_online ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-900 font-semibold text-sm sm:text-base truncate">{device.device_label}</h3>
                    <p className="text-gray-500 text-xs sm:text-sm truncate">{device.phone_number || 'No number'}</p>
                  </div>
                </div>
                <div className="flex gap-1.5 sm:gap-2 ml-2">
                  <button
                    onClick={() => handleToggleActive(device)}
                    className={`p-2 rounded-lg transition-colors ${device.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}
                    title={device.is_active ? 'Active' : 'Inactive'}
                  >
                    <MdSignalCellularAlt className="text-base sm:text-lg" />
                  </button>
                  <button
                    onClick={() => handleDeleteDevice(device.id)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <MdDelete className="text-base sm:text-lg" />
                  </button>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${device.is_online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className={`text-xs sm:text-sm font-medium ${device.is_online ? 'text-green-600' : 'text-gray-500'}`}>
                    {device.is_online ? 'Online' : 'Offline'}
                  </span>
                </div>
                {device.device_ip && (
                  <span className="text-xs text-gray-400 font-mono">{device.device_ip}</span>
                )}
              </div>
                
              {/* Warmup Stage */}
              <div className="mb-3">
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className={`font-medium ${warmupInfo.color}`}>{warmupInfo.label}</span>
                  <span className="text-gray-500">{warmupInfo.limit}</span>
                </div>
              </div>

              {/* Usage Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                  <span className="text-gray-600 font-medium">Today's Usage</span>
                  <span className="text-gray-900 font-semibold">{device.messages_sent_today} / {device.daily_limit}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className={`h-2 rounded-full ${utilizationPercent >= 90 ? 'bg-red-500' : utilizationPercent >= 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  ></motion.div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500 text-xs mb-0.5">Total Sent</div>
                  <div className="text-gray-900 font-bold text-sm sm:text-base">{device.total_messages_sent}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500 text-xs mb-0.5">Failed</div>
                  <div className="text-red-600 font-bold text-sm sm:text-base">{device.total_messages_failed}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-500 text-xs mb-0.5">Battery</div>
                  <div className="text-gray-900 font-bold text-sm sm:text-base">{device.battery_level || '--'}%</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleViewPerformance(device)}
                  className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium flex items-center justify-center gap-1"
                >
                  <MdBarChart />
                  Performance
                </button>
                <button
                  onClick={() => handleToggleActive(device)}
                  className={`flex-1 px-3 py-2 rounded-lg transition-colors text-xs font-medium ${
                    device.is_active
                      ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {device.is_active ? 'Pause' : 'Activate'}
                </button>
                <button
                  onClick={() => handleDeleteDevice(device.id)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium"
                >
                  <MdDelete />
                </button>
              </div>

              {/* Network Type */}
              {device.network_type && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-500 font-medium">{device.network_type}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {devices.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 sm:py-16 bg-white rounded-xl border-2 border-dashed border-gray-300"
        >
          <MdPhoneAndroid className="text-5xl sm:text-6xl text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-base sm:text-lg mb-2">No devices added yet</p>
          <p className="text-gray-500 text-sm mb-6">Add your first device to start sending messages</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
          >
            Add Your First Device
          </button>
        </motion.div>
      )}

      {/* Add Device Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deviceToken && setShowAddModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-5 sm:p-6 w-full max-w-md shadow-2xl"
              >
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Add New Device</h2>
                  {!deviceToken && (
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <MdClose className="text-xl text-gray-500" />
                    </button>
                  )}
                </div>
                
                {deviceToken ? (
                  <div>
                    <p className="text-gray-700 mb-4 text-sm sm:text-base">Device created successfully! Save this token in your Android app:</p>
                    <div className="bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
                      <code className="text-primary-600 text-xs sm:text-sm break-all font-mono">{deviceToken}</code>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-yellow-800 text-xs sm:text-sm">⚠️ This token will only be shown once. Copy it now!</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setDeviceToken(null);
                      }}
                      className="w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAddDevice}>
                    <div className="mb-4">
                      <label className="block text-gray-700 font-medium mb-2 text-sm">Device Label *</label>
                      <input
                        type="text"
                        value={newDevice.device_label}
                        onChange={(e) => setNewDevice({ ...newDevice, device_label: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="e.g., Phone-001"
                        required
                      />
                    </div>
                    <div className="mb-5">
                      <label className="block text-gray-700 font-medium mb-2 text-sm">Phone Number (Optional)</label>
                      <input
                        type="text"
                        value={newDevice.phone_number}
                        onChange={(e) => setNewDevice({ ...newDevice, phone_number: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                        placeholder="+1234567890"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg shadow-primary-500/30"
                      >
                        Create Device
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
  // NEW: Device performance summary
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [performanceSummary, setPerformanceSummary] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const fetchPerformanceSummary = async (deviceId) => {
    setLoadingPerformance(true);
    try {
      const response = await api.get(`/api/devices/${deviceId}/performance-summary`);
      setPerformanceSummary(response.data.performance_summary);
    } catch (error) {
      console.error('Error fetching performance summary:', error);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const handleViewPerformance = (device) => {
    setSelectedDevice(device);
    fetchPerformanceSummary(device.id);
  };
      {/* Performance Summary Modal */}
      <AnimatePresence>
        {selectedDevice && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDevice(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Device Performance</h3>
                    <p className="text-gray-600">{selectedDevice.device_label}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDevice(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MdClose className="text-xl text-gray-500" />
                  </button>
                </div>

                {loadingPerformance ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : performanceSummary ? (
                  <div className="space-y-6">
                    {/* Device Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Device Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className={`ml-2 font-medium ${
                            performanceSummary.device_info.is_online ? 'text-green-600' : 'text-gray-500'
                          }`}>
                            {performanceSummary.device_info.is_online ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <span className="ml-2 font-medium">{performanceSummary.device_info.phone_number || 'Not set'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Warmup Stage:</span>
                          <span className="ml-2 font-medium">{performanceSummary.device_info.warmup_stage?.replace('STAGE_', 'Stage ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Daily Limit:</span>
                          <span className="ml-2 font-medium">{performanceSummary.device_info.daily_limit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Recent Activity (24h)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{performanceSummary.recent_activity.messages_last_24h}</div>
                          <div className="text-xs text-gray-600">Messages Sent</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{performanceSummary.recent_activity.successful_messages}</div>
                          <div className="text-xs text-gray-600">Successful</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{performanceSummary.recent_activity.failed_messages}</div>
                          <div className="text-xs text-gray-600">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{performanceSummary.recent_activity.success_rate}%</div>
                          <div className="text-xs text-gray-600">Success Rate</div>
                        </div>
                      </div>
                    </div>

                    {/* Campaign Participation */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Campaign Participation</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{performanceSummary.campaign_participation.active_campaigns}</div>
                          <div className="text-xs text-gray-600">Active Campaigns</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{performanceSummary.campaign_participation.total_campaigns}</div>
                          <div className="text-xs text-gray-600">Total Campaigns</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-orange-600">{performanceSummary.campaign_participation.total_assigned_messages}</div>
                          <div className="text-xs text-gray-600">Assigned Messages</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-600">{performanceSummary.campaign_participation.total_sent_messages}</div>
                          <div className="text-xs text-gray-600">Sent Messages</div>
                        </div>
                      </div>
                    </div>

                    {/* Overall Stats */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">Overall Statistics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total Messages Sent:</span>
                          <span className="ml-2 font-medium">{performanceSummary.overall_stats.total_messages_sent.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Total Failed:</span>
                          <span className="ml-2 font-medium text-red-600">{performanceSummary.overall_stats.total_messages_failed.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Overall Success Rate:</span>
                          <span className="ml-2 font-medium text-green-600">{performanceSummary.overall_stats.overall_success_rate}%</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Message:</span>
                          <span className="ml-2 font-medium">
                            {performanceSummary.overall_stats.last_message_sent_at 
                              ? new Date(performanceSummary.overall_stats.last_message_sent_at).toLocaleString()
                              : 'Never'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Timing Analytics Button */}
                    <div className="flex justify-center pt-4">
                      <button
                        onClick={() => {
                          setSelectedDevice(null);
                          window.location.href = '/timing-analytics';
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <MdTimer />
                        View Detailed Timing Analytics
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Failed to load performance data
                  </div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>