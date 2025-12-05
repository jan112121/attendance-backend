// models/Attendance.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import User from './users.js';

const Attendance = sequelize.define(
  'Attendance',
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
    time_in:{
      type: DataTypes.TIME,
      allowNull: true,
    },
    time_out:{
      type: DataTypes.TIME,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('present', 'late', 'absent'),
      allowNull: false,
      defaultValue: 'present',
    },
    lat: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    lng: {
      type: DataTypes.DOUBLE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    session: {
      type: DataTypes.ENUM('morning', 'afternoon'),
      allowNull: false,
    },
  },
  {
    tableName: 'attendance',
    timestamps: false,
  }
);

// Associations
Attendance.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Attendance, { foreignKey: 'user_id' });

export default Attendance;
