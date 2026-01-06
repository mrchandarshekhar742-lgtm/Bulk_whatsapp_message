const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DeviceCampaign = sequelize.define('DeviceCampaign', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  campaign_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'campaigns',
      key: 'id',
    },
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'devices',
      key: 'id',
    },
  },
  
  // NEW: Per-Device Message Management
  assigned_message_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'How many messages this device should send in this campaign',
  },
  messages_sent_in_campaign: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'How many messages this device has sent in this campaign',
  },
  
  assigned_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  sent_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'device_campaigns',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      unique: true,
      fields: ['campaign_id', 'device_id'],
      name: 'unique_campaign_device'
    }
  ]
});

module.exports = DeviceCampaign;