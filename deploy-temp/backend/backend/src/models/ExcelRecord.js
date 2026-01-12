const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExcelRecord = sequelize.define('ExcelRecord', {
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
  file_name: {
    type: DataTypes.STRING,
    allowNull: false
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
  total_rows: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  rows: {
    type: DataTypes.JSON,
    allowNull: false
  },
  uploaded_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'excel_records',
  timestamps: false // Database uses uploaded_at instead of created_at/updated_at
});

module.exports = ExcelRecord;