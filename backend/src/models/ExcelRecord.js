const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExcelRecord = sequelize.define(
  'ExcelRecord',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    file_path: {
      type: DataTypes.STRING(1000),
      allowNull: false,
    },
    total_rows: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rows: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'excel_records',
    timestamps: false,
  }
);

module.exports = ExcelRecord;
