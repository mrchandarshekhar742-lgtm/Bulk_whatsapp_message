import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdRefresh, MdFilterList, MdSend, MdError, MdSchedule, MdCheckCircle } from 'react-icons/md';
import DashboardLayout from '../components/DashboardLayout';
import api from '../api/client';

export default function CampaignLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_queued: 0,
    total_sent: 0,
    total_failed: 0,
    total_delivered: 0,
    devices_online: 0,
    devices_total: 0,
  });
  const [filters, setFilters] = useState({
    status: '',
    device_id: '',
    excel_record_id: '',
  });
  const [devices, setDevices] = useState([]);
  const [excelFiles, setExcelFiles] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchLogs();
    fetchDevices();
    fetchExcelFiles();
    fetchStats();
  }, [filters, pagination.page]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh, filters, pagination.page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      
      const response = await api.get(`/api/campaigns/logs?${params}`);
      setLogs(response.data.logs);
      setPagination(prev => ({ ...prev, ...response.data.pagination }));
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await api.get('/api/devices');
      setDevices(response.data.devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchExcelFiles = async () => {
    try {
      const response = await api.get('/api/excel');
      setExcelFiles(response.data.records || []);
    } catch (error) {
      console.error('Error fetching Excel files:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/campaigns/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = () => {
    fetchLogs();
    fetchStats();
  };

  const getStatusColor = (status) => {
    const colors = {
      QUEUED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      SENT: 'bg-green-100 text-green-700 border-green-200',
      DELIVERED: 'bg-blue-100 text-blue-700 border-blue-200',
      FAILED: 'bg-red-100 text-red-700 border-red-200',
      PENDING: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[status] || colors.PENDING;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <DashboardLayout title="Campaign Logs">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MdSchedule className="text-blue-600 text-lg sm:text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Queued</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.total_queued}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MdSend className="text-green-600 text-lg sm:text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Sent</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.total_sent}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <MdError className="text-red-600 text-lg sm:text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Failed</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.total_failed}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MdCheckCircle className="text-purple-600 text-lg sm:text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Success Rate</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">
                {stats.total_sent + stats.total_failed > 0 
                  ? Math.round((stats.total_sent / (stats.total_sent + stats.total_failed)) * 100)
                  : 0}%
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <MdCheckCircle className="text-indigo-600 text-lg sm:text-xl" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Devices Online</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900">{stats.devices_online}/{stats.devices_total}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <p className="text-gray-600 text-sm sm:text-base">View all message sending logs</p>
          <p className="text-xs text-gray-500 mt-1">
            Auto-refresh: {autoRefresh ? 'ON' : 'OFF'} • Updates every 10 seconds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={handleRefresh}
            className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 transition-colors"
          >
            <MdRefresh className="text-lg" />
            <span className="hidden sm:inline text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 sm:p-5 mb-5 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <MdFilterList className="text-gray-700 text-lg sm:text-xl" />
          <span className="text-gray-900 font-semibold text-sm sm:text-base">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
            >
              <option value="">All Statuses</option>
              <option value="QUEUED">Queued</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-2">Device</label>
            <select
              value={filters.device_id}
              onChange={(e) => setFilters({ ...filters, device_id: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
            >
              <option value="">All Devices</option>
              {devices.map(device => (
                <option key={device.id} value={device.id}>
                  {device.device_label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-xs sm:text-sm font-medium mb-2">Excel File</label>
            <select
              value={filters.excel_record_id}
              onChange={(e) => setFilters({ ...filters, excel_record_id: e.target.value })}
              className="w-full px-3 sm:px-4 py-2 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
            >
              <option value="">All Files</option>
              {excelFiles.map(file => (
                <option key={file.id} value={file.id}>
                  {file.file_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table - Desktop */}
      <div className="hidden lg:block bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 text-xs font-semibold uppercase tracking-wider">Device</th>
                <th className="px-4 py-3 text-left text-gray-700 text-xs font-semibold uppercase tracking-wider">Recipient</th>
                <th className="px-4 py-3 text-left text-gray-700 text-xs font-semibold uppercase tracking-wider">Message</th>
                <th className="px-4 py-3 text-left text-gray-700 text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-gray-700 text-xs font-semibold uppercase tracking-wider">Time</th>
                <th className="px-4 py-3 text-left text-gray-700 text-xs font-semibold uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                logs.map((log, index) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900 text-sm font-medium">
                      {log.Device?.device_label || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 text-sm">
                      {log.recipient_number}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-sm max-w-xs truncate">
                      {log.message_content}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                      {log.device_ip || '--'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200">
            <div className="text-gray-600 text-xs sm:text-sm">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Previous
              </button>
              <span className="px-3 sm:px-4 py-2 text-gray-700 text-sm">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 sm:px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logs Cards - Mobile */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500">No logs found</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {log.Device?.device_label || 'Unknown'}
                  </div>
                  <div className="text-sm text-gray-600 truncate">{log.recipient_number}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(log.status)}`}>
                  {log.status}
                </span>
              </div>
              <div className="text-sm text-gray-700 mb-3 line-clamp-2">
                {log.message_content}
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{formatDate(log.created_at)}</span>
                <span className="font-mono">{log.device_ip || '--'}</span>
              </div>
            </motion.div>
          ))
        )}

        {/* Mobile Pagination */}
        {pagination.totalPages > 1 && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="text-center text-xs text-gray-600 mb-3">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
