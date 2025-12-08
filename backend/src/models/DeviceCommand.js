const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeviceCommand = sequelize.define('DeviceCommand', {
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
  command_type: {
    type: DataTypes.ENUM('SEND_MESSAGE', 'SEND_MEDIA', 'SYNC_STATUS', 'RESTART', 'UPDATE_CONFIG'),
    allowNull: false,
  },
  
  payload: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  
  status: {
    type: DataTypes.ENUM('PENDING', 'SENT', 'ACKNOWLEDGED', 'COMPLETED', 'FAILED'),
    defaultValue: 'PENDING',
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
  },
  
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'device_commands',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = DeviceCommand;
