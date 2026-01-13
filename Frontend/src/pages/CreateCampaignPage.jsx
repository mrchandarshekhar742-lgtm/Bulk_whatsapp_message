import { useState, useEffect } from 'react';
import { MdSend, MdArrowBack } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import DeviceAllocationForm from '../components/DeviceAllocationForm';
import TimingConfigForm from '../components/TimingConfigForm';
import { apiClient } from '../api/client';

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [excelFiles, setExcelFiles] = useState([]);
  const [devices, setDevices] = useState([]);
  
  const [inputMode, setInputMode] = useState('excel'); // 'excel' or 'manual'
  const [manualNumbers, setManualNumbers] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    excel_record_id: '',
    message_template: '',
    device_ids: [],
  });

  // NEW: Device allocation and timing config
  const [deviceAllocations, setDeviceAllocations] = useState({});
  const [timingConfig, setTimingConfig] = useState({
    strategy: 'RANDOM',
    min_delay: 2000,
    max_delay: 10000,
    enable_smart_timing: true,
  });
  const [totalMessages, setTotalMessages] = useState(0);

  useEffect(() => {
    fetchExcelFiles();
    fetchDevices();
  }, []);

  // NEW: Update total messages when input changes
  useEffect(() => {
    if (inputMode === 'manual') {
      const count = manualNumbers.split('\n').filter(line => line.trim().length > 0).length;
      setTotalMessages(count);
    } else if (formData.excel_record_id) {
      const selectedExcel = excelFiles.find(f => f.id === parseInt(formData.excel_record_id));
      setTotalMessages(selectedExcel?.total_rows || 0);
    }
  }, [inputMode, manualNumbers, formData.excel_record_id, excelFiles]);

  const fetchExcelFiles = async () => {
    try {
      const response = await apiClient.get('/excel');
      setExcelFiles(response.data.records || []);
    } catch (error) {
      console.error('Error fetching Excel files:', error);
    }
  };

  const fetchDevices = async () => {
    try {
      const response = await apiClient.get('/devices');
      setDevices(response.data.devices.filter(d => d.is_active));
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const handleDeviceToggle = (deviceId) => {
    setFormData(prev => ({
      ...prev,
      device_ids: prev.device_ids.includes(deviceId)
        ? prev.device_ids.filter(id => id !== deviceId)
        : [...prev.device_ids, deviceId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.device_ids.length === 0) {
      alert('Please select at least one device');
      return;
    }

    if (inputMode === 'manual' && !manualNumbers.trim()) {
      alert('Please enter at least one phone number');
      return;
    }

    if (inputMode === 'excel' && !formData.excel_record_id) {
      alert('Please select an Excel file');
      return;
    }

    // Check device allocations
    const totalAllocated = Object.values(deviceAllocations).reduce((sum, count) => sum + (count || 0), 0);
    if (totalAllocated !== totalMessages && totalMessages > 0) {
      const proceed = confirm(
        `Device allocation (${totalAllocated}) doesn't match total messages (${totalMessages}). Continue anyway?`
      );
      if (!proceed) return;
    }

    setLoading(true);
    try {
      let response;
      
      const campaignData = {
        ...formData,
        device_message_distribution: deviceAllocations,
        timing_config: timingConfig,
        rotation_mode: 'SMART_ROTATION',
      };
      
      if (inputMode === 'manual') {
        // Parse manual numbers
        const numbers = manualNumbers
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        
        // Send manual campaign
        response = await apiClient.post('/campaigns/manual', {
          name: formData.name,
          phone_numbers: numbers,
          message: formData.message_template,
          device_ids: formData.device_ids,
          device_message_distribution: deviceAllocations,
          timing_config: timingConfig,
          rotation_mode: 'SMART_ROTATION',
        });

      } else {
        // Send Excel campaign
        response = await apiClient.post('/campaigns', campaignData);
      }
      
      // Update device allocations if campaign was created successfully
      if (response.data.campaign?.id) {
        try {
          await apiClient.put(`/campaigns/${response.data.campaign.id}/device-allocation`, {
            device_allocations: deviceAllocations,
          });
          console.log('Device allocation updated successfully');
        } catch (allocationError) {
          console.log('Device allocation will be handled automatically by the system');
          // Don't show error to user since campaign is working fine
        }
      }
      
      // Show success message with details
      const successMsg = `✅ Campaign Created Successfully!\n\n${response.data.message}\n\nRedirecting to Campaign Logs...`;
      alert(successMsg);
      
      // Redirect to logs page immediately for better UX
      navigate('/logs');
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert(error.response?.data?.error || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const selectedExcel = excelFiles.find(f => f.id === parseInt(formData.excel_record_id));
  const onlineDevices = devices.filter(d => d.is_online);
  const totalCapacity = formData.device_ids.reduce((sum, id) => {
    const device = devices.find(d => d.id === id);
    return sum + (device ? device.daily_limit - device.messages_sent_today : 0);
  }, 0);
  
  const manualNumberCount = manualNumbers.split('\n').filter(line => line.trim().length > 0).length;
  const totalRecipients = inputMode === 'manual' ? manualNumberCount : (selectedExcel?.total_rows || 0);

  return (
    <DashboardLayout title="Create Campaign">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 sm:gap-4 mb-6">
          <button
            onClick={() => navigate('/campaigns')}
            className="p-2 sm:p-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <MdArrowBack className="text-lg sm:text-xl" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-gray-600 text-sm">Send bulk messages using your devices</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {/* Campaign Name */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">Campaign Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="e.g., Summer Promotion 2024"
              required
            />
          </div>

          {/* Input Mode Toggle */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <label className="block text-gray-900 font-semibold mb-3 text-sm sm:text-base">Input Method</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInputMode('excel')}
                className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  inputMode === 'excel'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📊 Excel File
              </button>
              <button
                type="button"
                onClick={() => setInputMode('manual')}
                className={`px-4 sm:px-6 py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                  inputMode === 'manual'
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✍️ Manual Entry
              </button>
            </div>
          </div>

          {/* Excel File Selection */}
          {inputMode === 'excel' && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">Select Excel File *</label>
              <select
                value={formData.excel_record_id}
                onChange={(e) => setFormData({ ...formData, excel_record_id: e.target.value })}
                className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                required={inputMode === 'excel'}
              >
                <option value="">-- Select Excel File --</option>
                {excelFiles.map(file => (
                  <option key={file.id} value={file.id}>
                    {file.file_name} ({file.total_rows} contacts)
                  </option>
                ))}
              </select>
              {selectedExcel && (
                <div className="mt-3 p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-sm text-primary-700">
                    📊 {selectedExcel.total_rows} recipients will receive this message
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Manual Phone Number Entry */}
          {inputMode === 'manual' && (
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
              <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">Phone Numbers *</label>
              <textarea
                value={manualNumbers}
                onChange={(e) => setManualNumbers(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all h-40 sm:h-48 font-mono text-xs sm:text-sm"
                placeholder="+919876543210&#10;+919876543211&#10;+919876543212&#10;&#10;💡 For multiple messages to same number:&#10;+919876543210&#10;+919876543210&#10;+919876543210"
                required={inputMode === 'manual'}
              />
              <div className="mt-2 text-xs sm:text-sm text-gray-600">
                💡 Enter one phone number per line (with country code)
                <br />
                🔄 <strong>For multiple messages to same number:</strong> Repeat the number on multiple lines
                {manualNumberCount > 0 && (
                  <span className="ml-2 text-primary-600 font-medium">
                    • {manualNumberCount} messages will be sent
                  </span>
                )}
              </div>
            </div>
          )}



          {/* Message Template */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <label className="block text-gray-900 font-semibold mb-2 text-sm sm:text-base">Message {inputMode === 'excel' ? 'Template' : ''} *</label>
            <textarea
              value={formData.message_template}
              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all h-28 sm:h-32"
              placeholder={inputMode === 'excel' 
                ? "Hello {{Name}}, this is your message..." 
                : "Hello! This is your message..."}
              required
            />
            <div className="mt-2 text-xs sm:text-sm text-gray-600">
              {inputMode === 'excel' ? (
                <>💡 Use {'{{'} ColumnName {'}'} to insert values from Excel columns</>
              ) : (
                <>💡 This message will be sent to all phone numbers</>
              )}
            </div>
          </div>

          {/* Select Devices */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
              <label className="block text-gray-900 font-semibold text-sm sm:text-base">Select Devices *</label>
              <span className="text-xs sm:text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {onlineDevices.length} online / {devices.length} total
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {devices.map(device => {
                const isSelected = formData.device_ids.includes(device.id);
                const remainingCapacity = device.daily_limit - device.messages_sent_today;
                
                return (
                  <div
                    key={device.id}
                    onClick={() => device.is_online && handleDeviceToggle(device.id)}
                    className={`p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : device.is_online
                        ? 'border-gray-200 bg-white hover:border-primary-300 hover:shadow-md'
                        : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${device.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                        <span className="text-gray-900 font-semibold text-sm truncate">{device.device_label}</span>
                      </div>
                      {isSelected && (
                        <span className="text-primary-600 text-lg flex-shrink-0">✓</span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 truncate">
                      {device.phone_number || 'No number'}
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      {device.messages_sent_today} / {device.daily_limit} sent today
                      {remainingCapacity > 0 && (
                        <span className="text-green-600 ml-1">({remainingCapacity} available)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {devices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No devices available. Please add devices first.
              </div>
            )}

            {formData.device_ids.length > 0 && (
              <div className="mt-4 p-3 sm:p-4 bg-primary-50 rounded-lg border border-primary-200">
                <div className="text-xs sm:text-sm text-gray-700">
                  <strong className="text-primary-700">{formData.device_ids.length}</strong> devices selected
                  <br />
                  Total capacity: <strong className="text-green-600">{totalCapacity}</strong> messages
                  {totalRecipients > 0 && totalCapacity < totalRecipients && (
                    <div className="text-yellow-700 mt-2 text-xs sm:text-sm">
                      ⚠️ Warning: Capacity ({totalCapacity}) is less than recipients ({totalRecipients})
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>



          {/* Device Allocation Form */}
          {formData.device_ids.length > 0 && totalMessages > 0 && (
            <DeviceAllocationForm
              devices={devices.filter(d => formData.device_ids.includes(d.id))}
              totalMessages={totalMessages}
              onAllocationChange={setDeviceAllocations}
              initialAllocation={deviceAllocations}
            />
          )}

          {/* Timing Configuration Form */}
          {formData.device_ids.length > 0 && (
            <TimingConfigForm
              onConfigChange={setTimingConfig}
              initialConfig={timingConfig}
            />
          )}

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/campaigns')}
              className="w-full sm:flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.device_ids.length === 0}
              className="w-full sm:flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors shadow-lg shadow-primary-500/30"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <MdSend className="text-lg" />
                  <span>Create & Send Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
