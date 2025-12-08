import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
import { motion } from 'framer-motion';
import { MdDescription, MdCloudUpload, MdCheckCircle, MdTrendingUp } from 'react-icons/md';
import apiClient from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalRows: 0,
    averageRowsPerFile: 0,
    lastUploadTime: 'Never',
  });
  const [excelRecords, setExcelRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const didFetchRef = useRef(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    const fetchData = async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const response = await apiClient.get('/api/excel');
        const records = response.data.records || [];
        setExcelRecords(records.slice(0, 5)); // Show last 5 files

        const totalFiles = records.length;
        const totalRows = records.reduce((sum, r) => sum + (r.total_rows || 0), 0);
        const averageRows = totalFiles > 0 ? Math.round(totalRows / totalFiles) : 0;
        const lastUpload = records.length > 0 
          ? new Date(records[0].uploaded_at).toLocaleDateString() 
          : 'Never';

        setStats({
          totalFiles,
          totalRows,
          averageRowsPerFile: averageRows,
          lastUploadTime: lastUpload,
        });
      } catch (error) {
        console.error('Failed to fetch data:', error);
        if (error.response?.status === 401) {
          console.error('Authentication failed - token may be invalid or expired');
        }
      } finally {
        setLoading(false);
      }
    };

    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchData();
  }, []);

  const columns = [
    { key: 'file_name', label: 'File Name' },
    { key: 'total_rows', label: 'Rows' },
    {
      key: 'uploaded_at',
      label: 'Upload Date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl font-bold text-secondary-900 mb-2">Dashboard</h2>
        <p className="text-secondary-600">Welcome back! Here's your Excel file overview.</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCard
            icon={MdDescription}
            label="Total Files"
            value={stats.totalFiles}
            color="primary"
            trend={`${stats.totalFiles} uploaded`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCard
            icon={MdCloudUpload}
            label="Total Rows"
            value={stats.totalRows.toLocaleString()}
            color="success"
            trend={`${stats.averageRowsPerFile} avg per file`}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCard
            icon={MdCheckCircle}
            label="Last Upload"
            value={stats.lastUploadTime}
            color="warning"
            trend="Most recent file"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatCard
            icon={MdTrendingUp}
            label="Average File Size"
            value={`${stats.averageRowsPerFile}`}
            color="warning"
            trend="Rows per file"
          />
        </motion.div>
      </div>

      {/* Recent Files Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <DataTable
          title="Recent Files"
          subtitle="Your latest uploaded Excel files"
          columns={columns}
          data={excelRecords}
          emptyMessage="No files yet. Go to Excel to upload your first file."
        />
      </motion.div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-8 card p-6"
      >
        <div className="flex items-center gap-4">
          <div className="text-3xl text-primary-600">
            <MdDescription />
          </div>
          <div>
            <h3 className="text-lg font-bold text-secondary-900">About Excel Import</h3>
            <p className="text-secondary-600 mt-1">
              Upload your contact data in Excel format (xlsx, xls, csv). Each file is stored securely and can be exported anytime.
            </p>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
