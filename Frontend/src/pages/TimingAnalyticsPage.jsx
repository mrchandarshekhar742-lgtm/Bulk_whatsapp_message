import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MdTimer, 
  MdTrendingUp, 
  MdDevices, 
  MdRefresh, 
  MdBarChart,
  MdSpeed,
  MdAccessTime,
  MdSignalCellularAlt
} from 'react-icons/md';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/client';

export default function TimingAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [devices, setDevices] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [timingData, setTimingData] = useState(null);
  const [deviceTimingData, setDeviceTimingData] = useState(null);
  const [timeRange, setTimeRange] = useState(7); // days

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignTiming(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceTiming(selectedDevice.id);
    }
  }, [selectedDevice, timeRange]);

  const fetchInitialData = async () => {
    try {
      const [campaignsRes, devicesRes] = await Promise.all([
        api.get('/api/campaigns'),
        api.get('/api/devices')
      ]);
      
      setCampaigns(campaignsRes.data.campaigns || []);
      setDevices(devicesRes.data.devices || []);
      
      // Auto-select first campaign if available
      if (campaignsRes.data.campaigns?.length > 0) {
        setSelectedCampaign(campaignsRes.data.campaigns[0]);
      }
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignTiming = async (campaignId) => {
    try {
      const response = await api.get(`/api/campaigns/${campaignId}/timing-analytics`);
      setTimingData(response.data.timing_analytics);
    } catch (error) {
      console.error('Error fetching campaign timing:', error);
    }
  };

  const fetchDeviceTiming = async (deviceId) => {
    try {
      const response = await api.get(`/api/devices/${deviceId}/timing-analytics?days=${timeRange}`);
      setDeviceTimingData(response.data.device_timing_analytics);
    } catch (error) {
      console.error('Error fetching device timing:', error);
    }
  };

  const formatTime = (ms) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Timing Analytics</h1>
            <p className="text-gray-600">Monitor message timing and delivery performance</p>
          </div>
          
          <button
            onClick={fetchInitialData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <MdRefresh />
            <span>Refresh</span>
          </button>
        </div>

        {/* Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Campaign Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign Analysis</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Campaign
              </label>
              <select
                value={selectedCampaign?.id || ''}
                onChange={(e) => {
                  const campaign = campaigns.find(c => c.id === parseInt(e.target.value));
                  setSelectedCampaign(campaign);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a campaign</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name} ({campaign.status})
                  </option>
                ))}
              </select>
            </div>

            {selectedCampaign && timingData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <MdTimer className="text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Avg Time Gap</span>
                    </div>
                    <p className="text-lg font-bold text-blue-900 mt-1">
                      {formatTime(timingData.avg_time_gap)}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <MdSpeed className="text-green-600" />
                      <span className="text-sm font-medium text-green-900">Avg Delivery</span>
                    </div>
                    <p className="text-lg font-bold text-green-900 mt-1">
                      {formatTime(timingData.avg_delivery_time)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Min Gap:</span>
                    <span className="ml-1 font-medium">{formatTime(timingData.min_time_gap)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Gap:</span>
                    <span className="ml-1 font-medium">{formatTime(timingData.max_time_gap)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Messages:</span>
                    <span className="ml-1 font-medium">{formatNumber(timingData.total_messages)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Device Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Analysis</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Device
              </label>
              <select
                value={selectedDevice?.id || ''}
                onChange={(e) => {
                  const device = devices.find(d => d.id === parseInt(e.target.value));
                  setSelectedDevice(device);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a device</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.device_label} ({device.is_online ? 'Online' : 'Offline'})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Range
              </label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Last 24 hours</option>
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>

            {selectedDevice && deviceTimingData && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <MdAccessTime className="text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Avg Gap</span>
                    </div>
                    <p className="text-lg font-bold text-purple-900 mt-1">
                      {formatTime(deviceTimingData.avg_time_gap)}
                    </p>
                  </div>
                  
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <MdSignalCellularAlt className="text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">Messages</span>
                    </div>
                    <p className="text-lg font-bold text-orange-900 mt-1">
                      {formatNumber(deviceTimingData.total_messages)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Min Gap:</span>
                    <span className="ml-1 font-medium">{formatTime(deviceTimingData.min_time_gap)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Max Gap:</span>
                    <span className="ml-1 font-medium">{formatTime(deviceTimingData.max_time_gap)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Campaign Per-Device Breakdown */}
        {selectedCampaign && timingData && Object.keys(timingData.per_device_analytics || {}).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Per-Device Performance</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(timingData.per_device_analytics).map(([deviceId, data]) => (
                <div key={deviceId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <MdDevices className="text-gray-600" />
                    <h4 className="font-medium text-gray-900">{data.device_label}</h4>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Messages:</span>
                      <span className="font-medium">{formatNumber(data.message_count)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Gap:</span>
                      <span className="font-medium">{formatTime(data.avg_time_gap)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min Gap:</span>
                      <span className="font-medium">{formatTime(data.min_time_gap)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Gap:</span>
                      <span className="font-medium">{formatTime(data.max_time_gap)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Delivery:</span>
                      <span className="font-medium">{formatTime(data.avg_delivery_time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Device Daily Breakdown */}
        {selectedDevice && deviceTimingData && Object.keys(deviceTimingData.daily_breakdown || {}).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Performance Breakdown</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(deviceTimingData.daily_breakdown)
                .sort(([a], [b]) => new Date(b) - new Date(a))
                .slice(0, 8)
                .map(([date, data]) => (
                <div key={date} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {new Date(date).toLocaleDateString()}
                  </h4>
                  
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Messages:</span>
                      <span className="font-medium">{formatNumber(data.message_count)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Gap:</span>
                      <span className="font-medium">{formatTime(data.avg_time_gap)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty States */}
        {campaigns.length === 0 && devices.length === 0 && (
          <div className="text-center py-12">
            <MdBarChart className="mx-auto text-6xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">Create campaigns and add devices to see timing analytics</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}