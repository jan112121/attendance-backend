import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Users from './users.js'; // import your Users model

const Penalties = sequelize.define('Penalties', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Users,
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.0,
  },
  status: {
    type: DataTypes.ENUM('unpaid', 'paid'),
    allowNull: false,
    defaultValue: 'unpaid',
  },
}, {
  tableName: 'penalties',
  timestamps: true, // adds createdAt and updatedAt automatically
  underscored: true   // ✅ Tells Sequelize to use created_at & updated_at
});

// 🔗 Define relationships (optional but recommended)
Users.hasMany(Penalties, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Penalties.belongsTo(Users, { foreignKey: 'user_id' });

export default Penalties;
