// models/users.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Grade from './Levels/grades.model.js';
import Role from './roles.js';
import fs from 'fs';
import MasterList from './masterList.js'

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  first_name: { type: DataTypes.STRING, allowNull: false, defaultValue: ''},
  last_name: { type: DataTypes.STRING, allowNull: false, defaultValue: ''},
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  role_id: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  student_number: { type: DataTypes.STRING, allowNull: true },
  section: { type: DataTypes.STRING, allowNull: true },
  room_number: { type: DataTypes.STRING, allowNull: true },
  contact_number: { type: DataTypes.STRING, allowNull: true },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'user' },
  grade_id: { type: DataTypes.INTEGER, allowNull: true },
  status: { type: DataTypes.STRING, allowNull: true },

  aztec_code: { type: DataTypes.STRING, allowNull: false, unique: true },
  aztec_code_image: { type: DataTypes.TEXT, allowNull: true },

  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'users',
  timestamps: false
});

// Basic relationships
User.belongsTo(Role, { foreignKey: 'role_id' });
User.belongsTo(Grade, { foreignKey: 'grade_id' });

User.belongsTo(MasterList,{
  foreignKey: 'student_number',
  targetKey: 'student_number',
  as: 'master',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
})

Grade.hasMany(User, { foreignKey: 'grade_id' });

// ✅ Delete the Aztec code image file before destroying user
User.beforeDestroy(async (user) => {
  try {
    const imagePath = user.aztec_code_image;

    if (imagePath && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`🗑️ Deleted Aztec image for user ${user.id}`);
    }
  } catch (err) {
    console.error('Error deleting Aztec code image:', err);
  }
});

export default User;
