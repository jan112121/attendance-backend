import Attendance from '../models/attendance';
import AttendanceArchive from '../models/attendanceArchive';
import MasterList from '../models/masterList';
import { Op } from 'sequelize';

export const resetAttendanceDay = async () => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 1️⃣ Mark students with no scan today as Absent
    await Attendance.update(
      { status: 'Absent' },
      {
        where: {
          date: todayStr,
          timeIn: null,
          status: { [Op.ne]: 'Absent' },
        },
      }
    );

    // 2️⃣ Archive today’s attendance
    const todaysAttendance = await Attendance.findAll({ where: { date: todayStr } });

    if (todaysAttendance.length > 0) {
      const archiveData = todaysAttendance.map(a => ({
        user_id: a.user_id,
        date: a.date,
        session: a.session,
        status: a.status,
        time: a.time || null,
        time_out: a.timeOut || null,
        lat: a.lat || null,
        lng: a.lng || null,
        created_at: a.created_at || new Date(),
      }));

      await AttendanceArchive.bulkCreate(archiveData);
      console.log('✅ Archived today’s attendance records.');
    }

    // 3️⃣ Prepare next day’s attendance
    const allStudents = await MasterList.findAll();
    const nextDay = new Date(today);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    // Check if tomorrow's records already exist
    const existingTomorrow = await Attendance.count({ where: { date: nextDayStr } });
    if (existingTomorrow > 0) {
      console.log('⚠️ Attendance for tomorrow already exists. Skipping creation.');
      return;
    }

    const sessions = [
      { name: 'morning', time: '08:00:00' },
      { name: 'afternoon', time: '13:00:00' },
    ];

    const newRecords = [];

    allStudents.forEach(student => {
      sessions.forEach(session => {
        newRecords.push({
          user_id: student.id,
          date: nextDayStr,
          session: session.name,
          status: 'Pending',
          time: session.time,
          created_at: new Date(),
        });
      });
    });

    await Attendance.bulkCreate(newRecords);
    console.log('✨ Prepared new attendance sessions for tomorrow.');

  } catch (error) {
    console.error('❌ Error during daily attendance reset:', error);
  }
};

