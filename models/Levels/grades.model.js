import { DataTypes } from 'sequelize';
import sequelize from '../../config/db.js';
import SchoolLevel from './schoolLevel.model.js';

const Grade = sequelize.define('Grade', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  grade_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  school_level_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {model: SchoolLevel, key: 'id'}
  },
},{
    tableName: 'grades',
    timestamps: false
}
);

SchoolLevel.hasMany(Grade, {foreignKey: 'school_level_id'});
Grade.belongsTo(SchoolLevel, {foreignKey: 'school_level_id'});

export default Grade;