import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { FaUpload, FaFileExcel, FaDownload, FaTrash } from 'react-icons/fa';
import { apiClient } from '../api/client';

export default function ExcelPage(){
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const fetchList = async () => {
    try{
      setLoading(true);
      const resp = await apiClient.get('/api/excel');
      setRecords(resp.data.records || []);
    }catch(e){
      console.error('Failed to fetch excel records', e);
      setMessage('Failed to load files');
    }finally{
      setLoading(false);
    }
  }

  useEffect(()=>{ fetchList(); }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
  }

  const handleUpload = async () => {
    if(!file) {
      setMessage('Please select a file');
      return;
    }
    
    const form = new FormData();
    form.append('file', file);
    try{
      setUploading(true);
      setMessage('');
      await apiClient.post('/api/excel/upload', form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
      setMessage('✓ File uploaded successfully');
      setFile(null);
      fetchList();
      setTimeout(() => setMessage(''), 3000);
    }catch(e){
      console.error(e);
      setMessage('✗ Upload failed: ' + (e.response?.data?.error || e.message));
    }finally{ 
      setUploading(false); 
    }
  }

  const handleDelete = async (id, fileName) =>{
    if(!confirm(`Delete "${fileName}"?`)) return;
    try{
      await apiClient.delete(`/api/excel/${id}`);
      setMessage('✓ File deleted');
      fetchList();
      setTimeout(() => setMessage(''), 3000);
    }catch(e){ 
      console.error(e); 
      setMessage('✗ Delete failed');
    }
  }

  const handleExport = async (id, fileName) => {
    try {
      const response = await apiClient.get(`/api/excel/${id}/export`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
    } catch (e) {
      console.error('Export failed:', e);
      setMessage('✗ Export failed');
    }
  }

  return (
    <DashboardLayout title="Excel Management">
      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-lg p-6 mb-6"
      >
        <h2 className="text-2xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
          <FaUpload className="text-primary-500" />
          Upload Excel / CSV
        </h2>
        
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-4 p-3 rounded-lg text-sm font-medium ${
              message.includes('✓') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}
          >
            {message}
          </motion.div>
        )}

        <div className="border-2 border-dashed border-primary-300 rounded-lg p-8 bg-primary-50">
          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-center gap-2 cursor-pointer hover:bg-primary-100 p-4 rounded transition-colors">
              <FaFileExcel className="text-2xl text-primary-500" />
              <span className="text-secondary-700">
                {file ? file.name : 'Choose Excel or CSV file'}
              </span>
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv" 
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            
            <p className="text-xs text-secondary-500 text-center">
              Supported formats: .xlsx, .xls, .csv
            </p>

            <button 
              onClick={handleUpload} 
              disabled={uploading || !file}
              className="btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FaUpload />
              {uploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Files List Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-lg p-6"
      >
        <h2 className="text-2xl font-bold text-secondary-900 mb-6 flex items-center gap-2">
          <FaFileExcel className="text-primary-500" />
          Uploaded Files ({records.length})
        </h2>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="spinner" />
          </div>
        ) : (
          <div>
            {records.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <FaFileExcel className="text-6xl text-gray-300 mx-auto mb-4" />
                <p className="text-secondary-500 text-lg">No files uploaded yet</p>
                <p className="text-secondary-400 text-sm">Upload an Excel or CSV file to get started</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {records.map((r, idx) => (
                    <motion.div
                      key={r.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border border-secondary-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <FaFileExcel className="text-2xl text-primary-500" />
                          <div>
                            <h3 className="font-semibold text-secondary-900">{r.file_name}</h3>
                            <p className="text-xs text-secondary-500">
                              📊 {r.total_rows} rows • 📅 {new Date(r.uploaded_at).toLocaleDateString()} {new Date(r.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleExport(r.id, r.file_name)} 
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            title="Download file"
                          >
                            <FaDownload />
                            Export
                          </button>
                          <button 
                            onClick={() => handleDelete(r.id, r.file_name)} 
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                            title="Delete file"
                          >
                            <FaTrash />
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-lg p-6 mt-6 bg-blue-50 border border-blue-200"
      >
        <h3 className="text-lg font-bold text-blue-900 mb-3">📋 Excel File Format</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>✓ Columns: Phone Number, Name, Company, Message</li>
          <li>✓ Phone format: +91XXXXXXXXXX (WhatsApp format)</li>
          <li>✓ Maximum file size: 10MB</li>
          <li>✓ Supported formats: .xlsx, .xls, .csv</li>
        </ul>
      </motion.div>
    </DashboardLayout>
  );
}
