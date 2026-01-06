const { DataTypes } = require('sequelize');
const { sequelize } = require('./index');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  total_numbers: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  sent_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.ENUM('QUEUED', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'),
    defaultValue: 'QUEUED'
  },
  excel_record_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'excel_records',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // NEW: Device Management Features
  device_message_distribution: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Per-device message allocation: {deviceId: messageCount}'
  },
  
  // NEW: Timing Configuration & Analytics
  timing_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Timing settings: {min_delay, max_delay, strategy, custom_delays}'
  },
  timing_analytics: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Timing stats: {avg_gap, min_gap, max_gap, avg_delivery_time}'
  },
  
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'campaigns',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Campaign;