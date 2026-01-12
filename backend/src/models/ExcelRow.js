const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExcelRow = sequelize.define('ExcelRow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  excel_record_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'excel_records',
      key: 'id'
    }
  },
  phone_number: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: 'Duration in seconds before sending message'
  },
  message: {
    type: DataTypes.TEXT,
    comment: 'Custom message for this number'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'SENT', 'FAILED', 'SKIPPED'),
    defaultValue: 'PENDING'
  },
  sent_at: {
    type: DataTypes.DATE
  },
  error_message: {
    type: DataTypes.TEXT
  },
  device_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'devices',
      key: 'id'
    }
  },
  row_number: {
    type: DataTypes.INTEGER,
    comment: 'Original row number in Excel file'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'excel_rows',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = ExcelRow;