import React from 'react';
import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { motion } from 'framer-motion';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
import { apiClient } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    totalCampaigns: 0,
    messagesSent: 0
  });
  
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/campaigns/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchRecentCampaigns = async () => {
    try {
      const response = await apiClient.get('/campaigns/logs?limit=5');
      setRecentCampaigns(response.data.logs || []);
    } catch (error) {
      console.error('Error fetching recent campaigns:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchRecentCampaigns()]);
      setLoading(false);
    };

    loadData();

    // Auto-refresh every 30 seconds
    intervalRef.current = setInterval(() => {
      fetchStats();
      fetchRecentCampaigns();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const campaignColumns = [
    { key: 'id', label: 'ID' },
    { key: 'phone_number', label: 'Phone' },
    { key: 'message', label: 'Message' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created' }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <StatCard
            title="Total Devices"
            value={stats.totalDevices}
            icon="📱"
            color="blue"
          />
          <StatCard
            title="Online Devices"
            value={stats.onlineDevices}
            icon="🟢"
            color="green"
          />
          <StatCard
            title="Total Campaigns"
            value={stats.totalCampaigns}
            icon="📊"
            color="purple"
          />
          <StatCard
            title="Messages Sent"
            value={stats.messagesSent}
            icon="📤"
            color="orange"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Campaigns</h2>
          <DataTable
            data={recentCampaigns}
            columns={campaignColumns}
            emptyMessage="No recent campaigns found"
          />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}