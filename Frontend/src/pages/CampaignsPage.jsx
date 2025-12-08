import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { DataTable } from '../components/DataTable';
import { motion } from 'framer-motion';
import { MdDescription, MdCloudUpload, MdDownload, MdDelete, MdInfo } from 'react-icons/md';
import apiClient from '../api/client';

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [excelRecords, setExcelRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const didFetchRef = useRef(false);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchExcelRecords();
  }, []);

  const fetchExcelRecords = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      const response = await apiClient.get('/api/excel');
      setExcelRecords(response.data.records || []);
    } catch (error) {
      console.error('Failed to fetch excel records:', error);
      if (error.response?.status === 401) {
        console.error('Authentication failed - token may be invalid or expired');
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    try {
      await apiClient.delete(`/api/excel/${id}`);
      setExcelRecords(excelRecords.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete file:', error);
    }
  };

  const handleExport = async (id, fileName) => {
    try {
      const response = await apiClient.get(`/api/excel/${id}/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentElement.removeChild(link);
    } catch (error) {
      console.error('Failed to export file:', error);
    }
  };

  const columns = [
    { key: 'file_name', label: 'File Name' },
    { key: 'total_rows', label: 'Rows' },
    {
      key: 'uploaded_at',
      label: 'Upload Date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (id, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleExport(id, row.file_name)}
            className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded hover:bg-primary-200 transition-colors flex items-center gap-1"
            title="Download file"
          >
            <MdDownload /> Download
          </button>
          <button
            onClick={() => handleDelete(id)}
            className="px-3 py-1 text-xs bg-error-100 text-error-700 rounded hover:bg-error-200 transition-colors flex items-center gap-1"
            title="Delete file"
          >
            <MdDelete /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Excel Files">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-secondary-900 flex items-center gap-3">
              <MdDescription className="text-primary-600" />
              Excel Files
            </h2>
            <p className="text-secondary-600 mt-2">Manage and view all your uploaded Excel files</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/excel')}
            className="btn-primary gap-2 whitespace-nowrap shadow-lg hover:shadow-xl"
          >
            <MdCloudUpload className="text-xl" /> Upload File
          </motion.button>
        </div>
      </motion.div>

      {/* Excel Files Table */}
      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center h-96"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="spinner" />
            <p className="text-secondary-600 font-medium">Loading files...</p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <DataTable
            title="All Excel Files"
            subtitle={`${excelRecords.length} total file${excelRecords.length !== 1 ? 's' : ''}`}
            columns={columns}
            data={excelRecords}
            emptyMessage="No files found. Click 'Upload File' to import your first Excel file."
          />
        </motion.div>
      )}

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 card p-6 border-l-4 border-primary-500"
      >
        <div className="flex items-start gap-4">
          <div className="text-2xl text-primary-600 mt-1">
            <MdInfo />
          </div>
          <div>
            <h3 className="text-lg font-bold text-secondary-900">Supported Formats</h3>
            <p className="text-secondary-600 mt-2">
              You can upload Excel files in the following formats:
            </p>
            <ul className="list-disc list-inside text-secondary-600 mt-2 space-y-1">
              <li><code className="bg-secondary-100 px-2 py-1 rounded">.xlsx</code> - Modern Excel format</li>
              <li><code className="bg-secondary-100 px-2 py-1 rounded">.xls</code> - Legacy Excel format</li>
              <li><code className="bg-secondary-100 px-2 py-1 rounded">.csv</code> - Comma-separated values</li>
            </ul>
            <p className="text-secondary-600 mt-4 text-sm">
              All files are securely stored and can be downloaded or deleted anytime.
            </p>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
