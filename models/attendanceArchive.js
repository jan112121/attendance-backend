// models/AttendanceArchive.js


import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './users.js';

const AttendanceArchive = sequelize.define('AttendanceArchive', {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  time: {
    type: DataTypes.STRING,
  },
  time_out: {
    type: DataTypes.STRING,
  },
  session: {
    type: DataTypes.ENUM('morning', 'afternoon'),
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lat: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  lng: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'attendance_archive',
  timestamps: false,
});

// ✅ Relationship (optional for easier joins)
AttendanceArchive.belongsTo(User, { foreignKey: 'user_id' });

export default AttendanceArchive;
