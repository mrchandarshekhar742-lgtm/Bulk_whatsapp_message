const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Campaign = sequelize.define('Campaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  excel_record_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'excel_records',
      key: 'id'
    }
  },
  campaign_type: {
    type: DataTypes.ENUM('STANDARD', 'SCHEDULED', 'RECURRING'),
    defaultValue: 'STANDARD'
  },
  status: {
    type: DataTypes.ENUM('DRAFT', 'PENDING', 'RUNNING', 'COMPLETED', 'PAUSED', 'CANCELLED'),
    defaultValue: 'DRAFT'
  },
  message_content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  total_contacts: {
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
  pending_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rotation_mode: {
    type: DataTypes.ENUM('RANDOM', 'ROUND_ROBIN', 'LEAST_USED', 'WARMUP_AWARE'),
    defaultValue: 'WARMUP_AWARE'
  },
  selected_devices: {
    type: DataTypes.JSON,
    allowNull: true
  },
  scheduled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH'),
    defaultValue: 'MEDIUM'
  },
  rate_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  delay_between_messages: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
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
  }
}, {
  tableName: 'campaigns',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Campaign;