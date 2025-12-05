// models/associations.js
import User from './users.js';
import Attendance from './attendance.js';
import AttendanceArchive from './attendanceArchive.js';
import Grade from './Levels/grades.model.js';
import Role from './Roles.js';

// Roles & Grades
User.belongsTo(Role, { foreignKey: 'role_id' });
User.belongsTo(Grade, { foreignKey: 'grade_id' });
Grade.hasMany(User, { foreignKey: 'grade_id' });

// Attendance relationships (Cascade delete)
User.hasMany(Attendance, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Attendance.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

// Archived attendance relationships
User.hasMany(AttendanceArchive, { foreignKey: 'user_id', onDelete: 'CASCADE' });
AttendanceArchive.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });

export { User, Attendance, AttendanceArchive, Grade, Role };
