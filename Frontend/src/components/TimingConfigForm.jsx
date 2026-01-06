import { useState } from 'react';
import { MdTimer, MdTrendingUp, MdSettings, MdInfo } from 'react-icons/md';

export default function TimingConfigForm({ 
  onConfigChange, 
  initialConfig = {} 
}) {
  const [config, setConfig] = useState({
    strategy: 'RANDOM',
    min_delay: 2000,
    max_delay: 10000,
    custom_delays: [],
    enable_smart_timing: true,
    avoid_peak_hours: false,
    peak_hours_start: '09:00',
    peak_hours_end: '17:00',
    ...initialConfig
  });

  const strategies = [
    {
      value: 'CONSTANT',
      label: 'Constant Delay',
      description: 'Fixed delay between all messages',
      icon: '⏱️'
    },
    {
      value: 'RANDOM',
      label: 'Random Delay',
      description: 'Random delay within min-max range',
      icon: '🎲'
    },
    {
      value: 'EXPONENTIAL_BACKOFF',
      label: 'Exponential Backoff',
      description: 'Increasing delays to avoid spam detection',
      icon: '📈'
    },
    {
      value: 'CUSTOM',
      label: 'Custom Pattern',
      description: 'Define your own delay pattern',
      icon: '⚙️'
    }
  ];

  const handleConfigChange = (key, value) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const formatTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getEstimatedTime = () => {
    const avgDelay = config.strategy === 'CONSTANT' 
      ? config.min_delay 
      : (config.min_delay + config.max_delay) / 2;
    
    return avgDelay;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <MdTimer className="text-blue-600 text-xl" />
        <h3 className="text-lg font-semibold text-gray-900">Timing Configuration</h3>
      </div>

      {/* Strategy Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Timing Strategy
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {strategies.map((strategy) => (
            <div
              key={strategy.value}
              className={`relative border rounded-lg p-4 cursor-pointer transition-all ${
                config.strategy === strategy.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleConfigChange('strategy', strategy.value)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{strategy.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{strategy.label}</h4>
                  <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
                </div>
                {config.strategy === strategy.value && (
                  <div className="absolute top-2 right-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delay Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Delay (ms)
          </label>
          <input
            type="number"
            min="1000"
            max="300000"
            step="1000"
            value={config.min_delay}
            onChange={(e) => handleConfigChange('min_delay', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formatTime(config.min_delay)} minimum delay
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Delay (ms)
          </label>
          <input
            type="number"
            min={config.min_delay}
            max="300000"
            step="1000"
            value={config.max_delay}
            onChange={(e) => handleConfigChange('max_delay', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={config.strategy === 'CONSTANT'}
          />
          <p className="text-xs text-gray-500 mt-1">
            {formatTime(config.max_delay)} maximum delay
          </p>
        </div>
      </div>

      {/* Custom Delays for CUSTOM strategy */}
      {config.strategy === 'CUSTOM' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Delay Pattern (comma-separated, in ms)
          </label>
          <input
            type="text"
            placeholder="2000, 5000, 3000, 8000"
            value={config.custom_delays.join(', ')}
            onChange={(e) => {
              const delays = e.target.value
                .split(',')
                .map(d => parseInt(d.trim()))
                .filter(d => !isNaN(d) && d > 0);
              handleConfigChange('custom_delays', delays);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Pattern will repeat for all messages
          </p>
        </div>
      )}

      {/* Advanced Options */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-medium text-gray-900 mb-4">Advanced Options</h4>
        
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={config.enable_smart_timing}
              onChange={(e) => handleConfigChange('enable_smart_timing', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Smart Timing</span>
              <p className="text-xs text-gray-600">Automatically adjust delays based on device performance</p>
            </div>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={config.avoid_peak_hours}
              onChange={(e) => handleConfigChange('avoid_peak_hours', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Avoid Peak Hours</span>
              <p className="text-xs text-gray-600">Increase delays during business hours</p>
            </div>
          </label>

          {config.avoid_peak_hours && (
            <div className="ml-6 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Peak Start
                </label>
                <input
                  type="time"
                  value={config.peak_hours_start}
                  onChange={(e) => handleConfigChange('peak_hours_start', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Peak End
                </label>
                <input
                  type="time"
                  value={config.peak_hours_end}
                  onChange={(e) => handleConfigChange('peak_hours_end', e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timing Preview */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <MdTrendingUp className="text-gray-600" />
          <h5 className="font-medium text-gray-900">Timing Preview</h5>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Average Delay:</span>
            <span className="ml-2 font-medium">{formatTime(getEstimatedTime())}</span>
          </div>
          <div>
            <span className="text-gray-600">Strategy:</span>
            <span className="ml-2 font-medium">{strategies.find(s => s.value === config.strategy)?.label}</span>
          </div>
        </div>

        {config.strategy === 'CUSTOM' && config.custom_delays.length > 0 && (
          <div className="mt-2">
            <span className="text-gray-600 text-sm">Pattern:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {config.custom_delays.map((delay, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                  {formatTime(delay)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2">
          <MdInfo className="text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Timing Best Practices:</p>
            <ul className="text-xs space-y-1">
              <li>• Use 2-10 second delays to avoid spam detection</li>
              <li>• Random delays appear more natural than constant delays</li>
              <li>• Longer delays during peak hours reduce blocking risk</li>
              <li>• Monitor delivery rates and adjust accordingly</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}