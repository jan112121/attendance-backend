// backend/models/penaltyRules.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PenaltyRules = sequelize.define('PenaltyRules', {
  condition: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

export default PenaltyRules;
