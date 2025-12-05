import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';


const ArchiveReports = sequelize.define('ArchiveReports', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  run_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  total_archived: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  summary_json: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'archive_reports',
  timestamps: false,
});

export default ArchiveReports;
