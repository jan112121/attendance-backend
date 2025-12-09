import cron from 'node-cron';
import { Op } from 'sequelize';
import moment from 'moment-timezone';
import User from '../models/users.js';
import Attendance from '../models/attendance.js';
import AttendanceArchive from '../models/attendanceArchive.js';
import MasterList from '../models/masterList.js';
import Penalties from '../models/penalties.js';
import PenaltyRules from '../models/penaltyRules.js';
import { sendEmailNotification } from './mailer.js';
import sequelize from '../config/db.js';

/** Helper: Get current PH date */
const getPhilippineDate = () => moment().tz('Asia/Manila').format('YYYY-MM-DD');

/** Apply penalty if rule exists */
const applyPenalty = async (user_id, reasonType) => {
  try {
    const rule = await PenaltyRules.findOne({
      where: { condition: reasonType.toLowerCase() },
    });

    if (rule && rule.amount !== undefined) {
      await Penalties.create({
        user_id,
        reason: reasonType.charAt(0).toUpperCase() + reasonType.slice(1),
        amount: parseFloat(rule.amount),
        status: 'unpaid',
      });
      console.log(`💸 Applied ${reasonType} penalty to user ${user_id}`);
    }
  } catch (err) {
    console.error(`❌ Failed to apply penalty for user ${user_id}:`, err.message);
  }
};

/** Check attendance for a session */
const checkSessionAttendance = async (session, cronTime) => {
  try {
    console.log(`[${moment().tz('Asia/Manila').format()}] 🕒 Checking ${session} attendance...`);
    const date = getPhilippineDate();

    const users = await User.findAll({
      where: { role_id: { [Op.in]: [2, 4] } },
    });

    for (const user of users) {
      const attendance = await Attendance.findOne({
        where: { user_id: user.id, date, session },
      });

      if (!attendance) {
        await Attendance.create({
          user_id: user.id,
          date,
          time: cronTime,
          time_out: cronTime,
          session,
          status: 'absent',
          lat: null,
          lng: null,
          created_at: new Date(),
        });

        await applyPenalty(user.id, 'absent');

        const masterRecord = await MasterList.findOne({
          where: sequelize.where(
            sequelize.fn('LOWER', sequelize.col('student_number')),
            user.student_number.toLowerCase()
          ),
        });

        if (masterRecord && masterRecord.parent_email) {
          const subject = `Absence Notification for ${user.first_name} ${user.last_name}`;
          const message = `
            <p>Dear Parent/Guardian,</p>
            <p>This is to inform you that <strong>${user.first_name}</strong> was marked 
            <strong>ABSENT</strong> during the <strong>${session}</strong> session on <strong>${date}</strong>.</p>
            <p>If this is incorrect, please contact the school administration.</p>
            <p>Thank you.</p>
            <br/>
            <p>— K-12 Smart Attendance System</p>
          `;
          await sendEmailNotification(masterRecord.parent_email, subject, message);
        } else {
          console.warn(`⚠️ No parent email found for ${user.first_name} ${user.last_name}`);
        }
      } else if (attendance.time && !attendance.time_out) {
        attendance.time_out = cronTime;
        await attendance.save();
        console.log(`⏰ Auto time_out set for ${user.first_name} (${session})`);
      }
    }

    console.log(`✅ ${session} attendance check completed.`);
  } catch (err) {
    console.error(`❌ Error in ${session} attendance check:`, err.message);
  }
};

/** Daily reset & archive */
const resetAttendanceDay = async () => {
  try {
    console.log(`[${moment().tz('Asia/Manila').format()}] 🌙 Running daily attendance reset...`);
    const yesterday = moment().tz('Asia/Manila').subtract(1, 'day').format('YYYY-MM-DD');

    const oldRecords = await Attendance.findAll({
      where: { date: yesterday },
      include: [
        { model: User, attributes: ['id', 'role_id'], where: { role_id: { [Op.in]: [2, 4] } } },
      ],
    });

    if (oldRecords.length > 0) {
      const archiveData = oldRecords.map((r) => ({
        user_id: r.user_id,
        date: r.date,
        time: r.time,
        time_out: r.time_out,
        session: r.session,
        status: r.status,
        lat: r.lat,
        lng: r.lng,
        created_at: r.created_at,
      }));

      await AttendanceArchive.bulkCreate(archiveData);
      await Attendance.destroy({
        where: { date: yesterday, user_id: oldRecords.map((r) => r.user_id) },
      });

      console.log(`✅ Archived ${archiveData.length} records from ${yesterday}`);
    } else {
      console.log(`ℹ️ No attendance records to archive for ${yesterday}`);
    }

    console.log('✨ Daily attendance reset completed.');
  } catch (err) {
    console.error('❌ Error during daily attendance reset:', err.message);
  }
};

/** Cron Jobs with PH timezone */

// Morning session → 12:15 PM
cron.schedule('15 12 * * *', async () => {
  await checkSessionAttendance('morning', '12:15:00');
}, { timezone: 'Asia/Manila' });

// Afternoon session → 5:00 PM
cron.schedule('0 17 * * *', async () => {
  await checkSessionAttendance('afternoon', '17:00:00');
}, { timezone: 'Asia/Manila' });

// Daily reset → 11:59 PM
cron.schedule('59 23 * * *', async () => {
  await resetAttendanceDay();
}, { timezone: 'Asia/Manila' });