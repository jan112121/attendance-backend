import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import SchoolLevel from './Levels/schoolLevel.model.js';
import Grade from './Levels/grades.model.js';

const MasterList = sequelize.define(
  'MasterList',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_number: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    parent_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parent_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    parent_email: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    grade_level: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    section: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    room_number: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    additional_info: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    school_level_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    grade_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: 'master_list',
    timestamps: false,
  },
);

MasterList.belongsTo(SchoolLevel, { foreignKey: 'school_level_id', as: 'schoolLevel' });
MasterList.belongsTo(Grade, { foreignKey: 'grade_id', as: 'grade' });


export default MasterList;
