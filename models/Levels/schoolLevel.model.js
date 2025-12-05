import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';

const SchoolLevel = sequelize.define(
  'SchoolLevel',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    level_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: 'school_levels',
    timestamps: false,
  }
);

export default SchoolLevel;