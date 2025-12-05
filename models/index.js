import User from './user.js';
import Attendance from './attendance.js';
import Penalties from './penalties.js';


// User ↔ Attendance
User.hasMany(Attendance, { foreignKey: 'user_id' });
Attendance.belongsTo(User, { foreignKey: 'user_id' });


// User ↔ Penalties
User.hasMany(Penalties, { foreignKey: 'user_id' });
Penalties.belongsTo(User, { foreignKey: 'user_id' });

// Optional: connect attendance and penalties if needed
// Attendance.hasOne(Penalties, { foreignKey: 'user_id', sourceKey: 'user_id' });
