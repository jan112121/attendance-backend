import { Op, Sequelize } from 'sequelize';
import User from '../models/users.js';
import MasterList from '../models/masterList.js';
import Attendance from '../models/attendance.js';
import AttendanceArchive from '../models/attendanceArchive.js';
import Grade from '../models/Levels/grades.model.js';
import SchoolLevel from '../models/Levels/schoolLevel.model.js';
import { getPhilippineDate } from '../utils/time.js';

export const getDashboardData = async (_req, res) => {
  try {
    const date = getPhilippineDate();
    const STUDENT_ROLE_ID = 2;

    // --------- GLOBAL DAILY COUNTS ---------
    const [totalStudent, totalUsers] = await Promise.all([
      User.count({ where: { role_id: STUDENT_ROLE_ID } }),
      User.count({ paranoid: false }),
    ]);

    const [presentToday, lateToday] = await Promise.all([
      Attendance.count({
        where: { date, status: 'present' },
        distinct: true,
        col: 'user_id',
      }),
      Attendance.count({
        where: { date, status: 'late' },
        distinct: true,
        col: 'user_id',
      }),
    ]);

    const absentToday = Math.max(totalStudent - presentToday - lateToday, 0);

    // --------- SCHOOL LEVELS / DEPARTMENTS ---------
    const schoolLevels = await SchoolLevel.findAll({
      include: {
        model: Grade,
        attributes: ['id', 'grade_name'],
      },
      order: [['id', 'ASC']],
    });

    const departments = await Promise.all(
      schoolLevels.map(async (level, index) => {
        const grades = level.Grades || [];
        const gradeIds = grades.map((g) => g.id);

        if (gradeIds.length === 0) {
          return {
            id: index + 1,
            name: level.level_name,
            total: 0,
            present: 0,
            late: 0,
            absent: 0,
            attendancePercentage: { present: 0, late: 0, absent: 0 },
            grades: [],
          };
        }

        // --------- FIND STUDENTS VIA MASTERLIST → GRADE ---------
        const students = await User.findAll({
          where: { role_id: STUDENT_ROLE_ID },
          attributes: ['id'],
          include: [
            {
              model: MasterList,
              as : 'master',
              required: true, 
              include: [
                {
                  model: Grade,
                  where: { id: { [Op.in]: gradeIds } },
                  attributes: [],
                  as: 'grade',
                },
              ],
            },
          ],
        });

        const userIds = students.map((s) => s.id);
        const total = userIds.length;

        if (total === 0) {
          return {
            id: index + 1,
            name: level.level_name,
            total: 0,
            present: 0,
            late: 0,
            absent: 0,
            attendancePercentage: { present: 0, late: 0, absent: 0 },
            grades: grades.map((g) => g.grade_name),
          };
        }

        // --------- COUNT ATTENDANCE FOR THESE STUDENTS ---------
        const [present, late] = await Promise.all([
          Attendance.count({
            where: {
              date,
              status: 'present',
              user_id: { [Op.in]: userIds },
            },
            distinct: true,
            col: 'user_id',
          }),
          Attendance.count({
            where: {
              date,
              status: 'late',
              user_id: { [Op.in]: userIds },
            },
            distinct: true,
            col: 'user_id',
          }),
        ]);

        const absent = Math.max(total - present - late, 0);

        return {
          id: index + 1,
          name: level.level_name,
          total,
          present,
          late,
          absent,
          attendancePercentage: {
            present: Math.round((present / total) * 100),
            late: Math.round((late / total) * 100),
            absent: Math.round((absent / total) * 100),
          },
          grades: grades.map((g) => g.grade_name),
        };
      })
    );

    // --------- SEND RESPONSE ---------
    res.json({
      stats: {
        totalStudent,
        totalUsers,
        presentToday,
        lateToday,
        absentToday,
        attendanceBreakdown: {
          present: presentToday,
          late: lateToday,
          absent: absentToday,
        },
      },
      departments,
    });
  } catch (error) {
    console.error('❌ Error loading dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
};

export const getWeeklyAttendance = async (req, res) => {
  try {
    const today = getPhilippineDate();
    const last7Days = [];

    // Generate last 7 dates (Saturday first)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    // Fetch all attendance records for the last 7 days
    const records = await AttendanceArchive.findAll({
      where: { date: { [Op.in]: last7Days } },
      attributes: ['date', 'status'],
    });

    const dayOrder = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    last7Days.sort((a, b) => {
      const dayA = new Date(a).getDay(); // 0 = Sunday
      const dayB = new Date(b).getDay();
      return dayOrder.indexOf(dayOrder[dayA]) - dayOrder.indexOf(dayOrder[dayB]);
    });

    // Initialize counters
    const presentData = [];
    const lateData = [];
    const absentData = [];

    last7Days.forEach((day) => {
      const dailyRecords = records.filter((r) => r.date === day);
      const presentCount = dailyRecords.filter((r) => r.status === 'present').length;
      const lateCount = dailyRecords.filter((r) => r.status === 'late').length;
      const absentCount = dailyRecords.filter((r) => r.status === 'absent').length;

      presentData.push(presentCount);
      lateData.push(lateCount);
      absentData.push(absentCount);
    });

    const labels = last7Days.map((d) =>
      new Date(d).toLocaleDateString('en-US', { weekday: 'short' }),
    );

    res.json({ labels, presentData, lateData, absentData });
  } catch (error) {
    console.error('❌ Error fetching weekly attendance:', error);
    res.status(500).json({ error: 'Failed to fetch weekly attendance' });
  }
};
