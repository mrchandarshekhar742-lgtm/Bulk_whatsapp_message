const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeviceLog = sequelize.define('DeviceLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'devices',
      key: 'id',
    },
  },
  campaign_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'campaigns',
      key: 'id',
    },
  },
  excel_record_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'excel_records',
      key: 'id',
    },
  },
  excel_row_index: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  
  recipient_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  message_content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  media_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  
  status: {
    type: DataTypes.ENUM('QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'PENDING'),
    defaultValue: 'QUEUED',
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  delivered_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  
  // Device info at time of send
  device_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  network_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
}, {
  tableName: 'device_logs',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = DeviceLog;
