const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  device_label: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  device_ip: {
    type: DataTypes.STRING(45),
    allowNull: true,
  },
  device_token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  
  // Status
  is_online: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  
  // Warm-up tracking
  warmup_stage: {
    type: DataTypes.ENUM('STAGE_1', 'STAGE_2', 'STAGE_3', 'STAGE_4'),
    defaultValue: 'STAGE_1',
  },
  warmup_started_at: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  messages_sent_today: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  daily_limit: {
    type: DataTypes.INTEGER,
    defaultValue: 15,
  },
  
  // Device info
  battery_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  network_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  android_version: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  app_version: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  
  // Metadata
  last_seen: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_message_sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  total_messages_sent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_messages_failed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'devices',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Device;
