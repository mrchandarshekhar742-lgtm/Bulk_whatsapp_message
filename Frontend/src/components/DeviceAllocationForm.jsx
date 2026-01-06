import { useState, useEffect } from 'react';
import { MdDevices, MdWarning, MdCheckCircle, MdError } from 'react-icons/md';

export default function DeviceAllocationForm({ 
  devices, 
  totalMessages, 
  onAllocationChange, 
  initialAllocation = {} 
}) {
  const [allocations, setAllocations] = useState(initialAllocation);
  const [autoDistribute, setAutoDistribute] = useState(false);

  useEffect(() => {
    if (autoDistribute && devices.length > 0 && totalMessages > 0) {
      handleAutoDistribute();
    }
  }, [autoDistribute, devices, totalMessages]);

  const handleAutoDistribute = () => {
    const activeDevices = devices.filter(d => d.is_active && d.is_online);
    if (activeDevices.length === 0) return;

    // Calculate distribution based on device capacity
    const totalCapacity = activeDevices.reduce((sum, device) => {
      const remaining = device.daily_limit - device.messages_sent_today;
      return sum + Math.max(0, remaining);
    }, 0);

    const newAllocations = {};
    let remainingMessages = totalMessages;

    activeDevices.forEach((device, index) => {
      const deviceCapacity = Math.max(0, device.daily_limit - device.messages_sent_today);
      
      if (index === activeDevices.length - 1) {
        // Last device gets remaining messages
        newAllocations[device.id] = remainingMessages;
      } else {
        // Distribute proportionally based on capacity
        const proportion = deviceCapacity / totalCapacity;
        const allocation = Math.floor(totalMessages * proportion);
        newAllocations[device.id] = Math.min(allocation, deviceCapacity);
        remainingMessages -= newAllocations[device.id];
      }
    });

    setAllocations(newAllocations);
    onAllocationChange(newAllocations);
  };

  const handleManualChange = (deviceId, value) => {
    const newAllocations = {
      ...allocations,
      [deviceId]: Math.max(0, parseInt(value) || 0),
    };
    setAllocations(newAllocations);
    onAllocationChange(newAllocations);
  };

  const getTotalAllocated = () => {
    return Object.values(allocations).reduce((sum, count) => sum + (count || 0), 0);
  };

  const getDeviceStatus = (device) => {
    const allocated = allocations[device.id] || 0;
    const capacity = device.daily_limit - device.messages_sent_today;
    
    if (allocated === 0) return { type: 'none', message: 'No messages allocated' };
    if (allocated > capacity) return { type: 'error', message: `Exceeds capacity by ${allocated - capacity}` };
    if (allocated === capacity) return { type: 'warning', message: 'Using full capacity' };
    return { type: 'success', message: `${capacity - allocated} capacity remaining` };
  };

  const totalAllocated = getTotalAllocated();
  const allocationDifference = totalAllocated - totalMessages;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <MdDevices className="text-blue-600 text-xl" />
          <h3 className="text-lg font-semibold text-gray-900">Device Message Allocation</h3>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoDistribute}
              onChange={(e) => setAutoDistribute(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Auto Distribute</span>
          </label>
          
          <div className="text-sm">
            <span className="text-gray-600">Total: </span>
            <span className={`font-semibold ${
              allocationDifference === 0 ? 'text-green-600' : 
              allocationDifference > 0 ? 'text-red-600' : 'text-orange-600'
            }`}>
              {totalAllocated} / {totalMessages}
            </span>
          </div>
        </div>
      </div>

      {/* Allocation Summary */}
      {allocationDifference !== 0 && (
        <div className={`mb-4 p-3 rounded-lg ${
          allocationDifference > 0 ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'
        }`}>
          <div className="flex items-center space-x-2">
            <MdWarning className={`${allocationDifference > 0 ? 'text-red-600' : 'text-orange-600'}`} />
            <span className={`text-sm font-medium ${
              allocationDifference > 0 ? 'text-red-800' : 'text-orange-800'
            }`}>
              {allocationDifference > 0 
                ? `Over-allocated by ${allocationDifference} messages`
                : `Under-allocated by ${Math.abs(allocationDifference)} messages`
              }
            </span>
          </div>
        </div>
      )}

      {/* Device List */}
      <div className="space-y-4">
        {devices.map((device) => {
          const status = getDeviceStatus(device);
          const capacity = device.daily_limit - device.messages_sent_today;
          
          return (
            <div key={device.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    device.is_online ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{device.device_label}</h4>
                    <p className="text-sm text-gray-600">
                      {device.phone_number || 'No phone number'} • 
                      Stage {device.warmup_stage?.replace('STAGE_', '')} • 
                      {device.messages_sent_today}/{device.daily_limit} sent today
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {status.type === 'success' && <MdCheckCircle className="text-green-600" />}
                  {status.type === 'warning' && <MdWarning className="text-orange-600" />}
                  {status.type === 'error' && <MdError className="text-red-600" />}
                  <span className={`text-xs ${
                    status.type === 'success' ? 'text-green-600' :
                    status.type === 'warning' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {status.message}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Messages to Send
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={capacity}
                    value={allocations[device.id] || 0}
                    onChange={(e) => handleManualChange(device.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!device.is_active}
                  />
                </div>
                
                <div className="text-sm text-gray-600">
                  <div>Capacity: {capacity}</div>
                  <div>Warmup Limit: {device.daily_limit}</div>
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Usage</span>
                  <span>{device.messages_sent_today + (allocations[device.id] || 0)} / {device.daily_limit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="flex h-2 rounded-full overflow-hidden">
                    {/* Already sent today */}
                    <div 
                      className="bg-blue-500"
                      style={{ width: `${(device.messages_sent_today / device.daily_limit) * 100}%` }}
                    />
                    {/* Allocated for this campaign */}
                    <div 
                      className={`${
                        (device.messages_sent_today + (allocations[device.id] || 0)) > device.daily_limit 
                          ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${((allocations[device.id] || 0) / device.daily_limit) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {devices.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <MdDevices className="mx-auto text-4xl mb-2" />
          <p>No devices available</p>
        </div>
      )}
    </div>
  );
}