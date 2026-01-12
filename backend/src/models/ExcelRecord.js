const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExcelRecord = sequelize.define('ExcelRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: true
  },
  original_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  file_path: {
    type: DataTypes.STRING(1000),
    allowNull: false
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  total_records: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  processed_records: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  has_duration_column: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  has_message_column: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  default_duration: {
    type: DataTypes.INTEGER,
    defaultValue: 30
  },
  default_message: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'excel_records',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ExcelRecord;