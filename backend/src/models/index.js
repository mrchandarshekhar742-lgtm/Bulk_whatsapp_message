const sequelize = require('../config/database');
const User = require('./User');
const ExcelRecord = require('./ExcelRecord');
const Device = require('./Device');
const DeviceLog = require('./DeviceLog');
const DeviceCommand = require('./DeviceCommand');
const Campaign = require('./Campaign');

// Define associations
User.hasMany(ExcelRecord, { foreignKey: 'user_id', as: 'excel_records' });
ExcelRecord.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Campaign, { foreignKey: 'user_id', as: 'campaigns' });
Campaign.belongsTo(User, { foreignKey: 'user_id' });

Campaign.belongsTo(ExcelRecord, { foreignKey: 'excel_record_id' });
ExcelRecord.hasMany(Campaign, { foreignKey: 'excel_record_id', as: 'campaigns' });

// Device associations
User.hasMany(Device, { foreignKey: 'user_id', as: 'devices' });
Device.belongsTo(User, { foreignKey: 'user_id' });

Device.hasMany(DeviceLog, { foreignKey: 'device_id', as: 'logs' });
DeviceLog.belongsTo(Device, { foreignKey: 'device_id' });

Device.hasMany(DeviceCommand, { foreignKey: 'device_id', as: 'commands' });
DeviceCommand.belongsTo(Device, { foreignKey: 'device_id' });

ExcelRecord.hasMany(DeviceLog, { foreignKey: 'excel_record_id', as: 'device_logs' });
DeviceLog.belongsTo(ExcelRecord, { foreignKey: 'excel_record_id' });

Campaign.hasMany(DeviceLog, { foreignKey: 'campaign_id', as: 'device_logs' });
DeviceLog.belongsTo(Campaign, { foreignKey: 'campaign_id' });

module.exports = {
  sequelize,
  User,
  ExcelRecord,
  Device,
  DeviceLog,
  DeviceCommand,
  Campaign,
};
